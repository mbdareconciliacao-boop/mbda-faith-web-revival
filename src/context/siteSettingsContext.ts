import { createContext } from "react";

import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "../data/siteSettings";

export const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS);
