import json
import tempfile
import unittest
from pathlib import Path
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, Mock
import requests
from scripts.news_repository import save_static_feed
from scripts.bounded_http import BoundedSession, validate_public_url
from scripts.news_scraper import ChristianNewsScraper


class CollectorTests(unittest.TestCase):
    def test_rss_html_becomes_bounded_text_without_attributes(self):
        scraper = ChristianNewsScraper.__new__(ChristianNewsScraper)
        self.assertEqual(scraper.clean_text('<a href="https://example.com/a">Notícia &amp; contexto</a><script>bad()</script>'), 'Notícia & contexto')
        self.assertEqual(scraper.clean_text('Fé, oração e vida em comunidade.'), 'Fé, oração e vida em comunidade.')
        self.assertLessEqual(len(scraper.clean_text('x' * 20000)), 16000)

    def test_preserves_last_good_when_empty(self):
        with tempfile.TemporaryDirectory() as root:
            target=Path(root)/'public/data/christian_news.json'
            target.parent.mkdir(parents=True)
            target.write_text('previous',encoding='utf8')
            with self.assertRaises(ValueError): save_static_feed(root, [], lambda value: None)
            self.assertEqual(target.read_text(), 'previous')

    def test_identical_edition_keeps_timestamp(self):
        with tempfile.TemporaryDirectory() as root:
            article=dict(title='Real article title',source='Guiame',url='https://guiame.com.br/news/example',date=datetime.now(timezone.utc).isoformat())
            path=save_static_feed(root,[article],datetime.fromisoformat)
            first=Path(path).read_bytes()
            save_static_feed(root,[article],datetime.fromisoformat)
            self.assertEqual(Path(path).read_bytes(),first)
            self.assertTrue(json.loads(first)['articles'][0]['publication_date_verified'])

    @patch('scripts.news_scraper.load_dotenv')
    def test_no_synthetic_news_or_automatic_database_deletion(self, _):
        with patch.dict('os.environ',{'NEWS_WRITE_SUPABASE':'false'}):
            scraper=ChristianNewsScraper()
        self.assertIsNone(scraper.supabase)
        self.assertEqual(scraper.get_fallback_news(),[])
        self.assertFalse(scraper.is_recent_article({'date':None}))
        future=(datetime.now(timezone.utc)+timedelta(hours=2)).isoformat()
        self.assertEqual(scraper.filter_for_output([{'date':future}]),[])
        with self.assertRaises(RuntimeError): scraper.cleanup_old_supabase_records()

    @patch('scripts.bounded_http.socket.getaddrinfo',return_value=[(2,1,6,'',('127.0.0.1',443))])
    def test_private_destination_rejected(self,_):
        with self.assertRaises(ValueError): validate_public_url('https://example.com/feed')

    @patch('scripts.bounded_http.validate_public_url')
    @patch.object(requests.Session,'request')
    def test_stream_is_bounded_and_closed(self, request, _):
        response=Mock(is_redirect=False,headers={})
        response.iter_content.return_value=iter([b'abcd',b'efgh'])
        request.return_value=response
        with self.assertRaises(requests.RequestException): BoundedSession(max_bytes=5).get('https://example.com/feed')
        response.close.assert_called_once()
        self.assertTrue(request.call_args.kwargs['stream'])

    @patch('scripts.bounded_http.validate_public_url')
    def test_budget_exhaustion_and_write_method_rejected(self,_):
        session=BoundedSession(max_requests=0)
        with self.assertRaises(requests.RequestException): session.get('https://example.com')
        with self.assertRaises(ValueError): session.post('https://example.com')

if __name__=='__main__': unittest.main()
