type AssetDisplayInput = {
  id?: string | null;
  asset_code?: string | null;
  assetCode?: string | null;
  name?: string | null;
  assetTitle?: string | null;
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const stripKnownPrefix = (name: string, prefix?: string | null) => {
  const normalizedPrefix = normalizeWhitespace(prefix ?? "");
  if (!normalizedPrefix) return name;

  const separators = String.raw`(?:\s*(?:[-_:|/\\]+|\u2013|\u2014|\.)\s*|\s+)`;
  const compactPrefixPattern = escapeRegExp(normalizedPrefix).replace(
    /\s+/g,
    separators,
  );
  return name.replace(
    new RegExp(`^${compactPrefixPattern}(?:${separators})+`, "i"),
    "",
  );
};

export function formatProjectLocalAssetName(
  name: string | null | undefined,
  assetCode?: string | null,
  assetId?: string | null,
) {
  const original = normalizeWhitespace(name ?? "");
  if (!original) return "";

  let displayName = stripKnownPrefix(original, assetCode);
  displayName = stripKnownPrefix(displayName, assetId);

  displayName = displayName
    .replace(
      /^[A-Za-z]{1,6}(?:[\s._-]+[A-Za-z0-9]{1,24}){1,5}[\s._:-]+(?=[A-Za-z])/,
      "",
    )
    .replace(
      /^(?:[A-Za-z]\s+){1,8}(?:[A-Za-z0-9]{1,24}[\s._:-]+)*(?=[A-Za-z])/,
      "",
    )
    .replace(/^[0-9a-f]{8,}(?:-[0-9a-f]{4,})*[\s._:-]+(?=[A-Za-z])/i, "")
    .replace(/^[\s._:-]*(?:[-\u2013\u2014]\s*)+/, "");

  const normalizedDisplayName = normalizeWhitespace(displayName);
  return normalizedDisplayName || original;
}

export function formatAssetDisplayName(asset: AssetDisplayInput | null | undefined) {
  if (!asset) return "";
  return formatProjectLocalAssetName(
    asset.name ?? asset.assetTitle,
    asset.asset_code ?? asset.assetCode,
    asset.id,
  );
}
