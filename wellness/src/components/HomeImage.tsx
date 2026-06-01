import { useEffect, useState, type ImgHTMLAttributes } from "react";

import ParallaxBackgroundImage from "@/components/ParallaxBackgroundImage";

type HomeImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc: string;
  parallax?: boolean;
};

const HomeImage = ({ fallbackSrc, parallax = false, src = "", ...props }: HomeImageProps) => {
  const [resolvedSrc, setResolvedSrc] = useState(fallbackSrc);
  const ImageComponent = parallax ? ParallaxBackgroundImage : "img";

  useEffect(() => {
    if (!src || src === fallbackSrc) {
      setResolvedSrc(fallbackSrc);
      return;
    }

    let isActive = true;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (isActive) {
        setResolvedSrc(src);
      }
    };
    image.onerror = () => {
      if (isActive) {
        setResolvedSrc(fallbackSrc);
      }
    };
    image.src = src;

    return () => {
      isActive = false;
    };
  }, [fallbackSrc, src]);

  return <ImageComponent {...props} src={resolvedSrc} />;
};

export default HomeImage;
