import { useEffect, useState, type ImgHTMLAttributes, type ReactEventHandler } from "react";

import ParallaxBackgroundImage from "@/components/ParallaxBackgroundImage";

type HomeImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc: string;
  parallax?: boolean;
};

const HomeImage = ({ fallbackSrc, onError, parallax = false, src = "", ...props }: HomeImageProps) => {
  const [resolvedSrc, setResolvedSrc] = useState(src || fallbackSrc);
  const ImageComponent = parallax ? ParallaxBackgroundImage : "img";

  useEffect(() => {
    setResolvedSrc(src || fallbackSrc);
  }, [fallbackSrc, src]);

  const handleError: ReactEventHandler<HTMLImageElement> = (event) => {
    if (resolvedSrc !== fallbackSrc) {
      setResolvedSrc(fallbackSrc);
    }
    onError?.(event);
  };

  return <ImageComponent {...props} src={resolvedSrc} onError={handleError} />;
};

export default HomeImage;
