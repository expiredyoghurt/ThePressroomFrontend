import { useEffect, useState } from "react";
import { fetchThumbnailBlob } from "../api/client";

/** A plain <img src="/api/thumbnail/1"> can't carry the Authorization header
 * our API requires, so this fetches the image as a blob and hands the
 * browser an object URL instead. Falls back to a placeholder emoji tile if
 * no thumbnail has been uploaded for the article (a 404 from the Worker,
 * not an error — thumbnails are optional, see routes/media.ts). */
export function ThumbnailImage({ articleId, alt }: { articleId: number; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    fetchThumbnailBlob(articleId).then((blob) => {
      if (cancelled) return;
      if (blob) {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      }
      setLoaded(true);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [articleId]);

  if (!loaded) {
    return <div className="thumbnail thumbnail--loading" />;
  }
  if (!url) {
    return (
      <div className="thumbnail thumbnail--placeholder" aria-label={alt}>
        📰
      </div>
    );
  }
  return <img src={url} alt={alt} className="thumbnail" />;
}
