export const buildApiUrl = (baseUrl: string, path: string) => {
  if (!baseUrl) return path;
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

