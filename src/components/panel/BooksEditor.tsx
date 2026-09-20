import { useState } from "react";

import { supabase } from "../../config/supabase";
import type { SiteBook, SiteContent } from "../../data/siteSettings";
import { imageUploadError } from "../../domain/editorialSafety";

interface EditorProps {
  content: SiteContent;
  onChange: (next: SiteContent) => void;
}

const EMPTY_BOOK: SiteBook = { slug: "", title: "", author: "", description: "", image: "" };

export default function BooksEditor({ content, onChange }: EditorProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const books = content.books;
  const patch = (next: SiteBook[]) => onChange({ ...content, books: next });
  const setBook = (index: number, key: keyof SiteBook, value: string) =>
    patch(books.map((item, i) => (i === index ? { ...item, [key]: value } : item)));

  const upload = async (index: number, file: File) => {
    if (!supabase) return;
    const validationError = imageUploadError(file);
    if (validationError) { setError(validationError); return; }
    const extension = (file.name.split(".").pop() ?? "webp").toLowerCase();
    const path = `livro-${Date.now()}.${extension}`;
    setBusy(true); setError("");
    try {
      const { error: uploadError } = await supabase.storage.from("site-media")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      setBook(index, "image", data.publicUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha no envio da imagem.");
    } finally { setBusy(false); }
  };

  return <>
    <h2 className="panel-section-title">Livros recomendados</h2>
    {error && <p className="panel-error" role="alert">{error}</p>}
    <div className="panel-list">
      {books.map((book, index) => (
        <div className="panel-item" key={`book-${index}`}>
          <div className="panel-item-grid">
            <label>Identificador (slug)<input value={book.slug} onChange={(e) => setBook(index, "slug", e.target.value)} /></label>
            <label>Título<input value={book.title} onChange={(e) => setBook(index, "title", e.target.value)} /></label>
            <label>Autor/editora<input value={book.author} onChange={(e) => setBook(index, "author", e.target.value)} /></label>
            <label>Imagem (URL)<input value={book.image} onChange={(e) => setBook(index, "image", e.target.value)} /></label>
            <label>Imagem (upload)<input type="file" accept="image/*" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(index, f); }} /></label>
            <label>Link (https)<input value={book.href ?? ""} onChange={(e) => setBook(index, "href", e.target.value)} /></label>
            <label>Texto do botão<input value={book.linkLabel ?? ""} onChange={(e) => setBook(index, "linkLabel", e.target.value)} /></label>
            <label className="panel-full">Descrição<textarea rows={2} value={book.description} onChange={(e) => setBook(index, "description", e.target.value)} /></label>
            <label className="panel-full">Observação de compra<input value={book.purchaseNote ?? ""} onChange={(e) => setBook(index, "purchaseNote", e.target.value)} /></label>
          </div>
          <div className="panel-item-actions">
            <button className="panel-link" type="button" disabled={index === 0} onClick={() => { const next = [...books]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; patch(next); }}>Subir</button>
            <button className="panel-link" type="button" disabled={index === books.length - 1} onClick={() => { const next = [...books]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; patch(next); }}>Descer</button>
            <button className="panel-link panel-remove" type="button" onClick={() => patch(books.filter((_, i) => i !== index))}>Remover</button>
          </div>
        </div>
      ))}
    </div>
    <button className="panel-link" type="button" onClick={() => patch([...books, { ...EMPTY_BOOK }])}>+ Adicionar livro</button>
  </>;
}
