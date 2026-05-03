import { useRef, type CSSProperties, type ImgHTMLAttributes } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

import { useDesktopImageEffects } from "@/hooks/useDesktopImageEffects";

interface ParallaxBackgroundImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "style"> {
  style?: CSSProperties;
}

const ParallaxMotionBackgroundImage = ({ style, ...props }: ParallaxBackgroundImageProps) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 64, damping: 18, mass: 0.28 });
  const y = useTransform(smoothProgress, [0, 1], ["0%", "16%"]);
  const scale = useTransform(smoothProgress, [0, 1], [1.06, 1.16]);

  return <motion.img ref={imageRef} {...props} style={{ ...style, y, scale }} />;
};

const ParallaxBackgroundImage = (props: ParallaxBackgroundImageProps) => {
  const desktopImageEffects = useDesktopImageEffects();

  if (!desktopImageEffects) {
    return <img {...props} />;
  }

  return <ParallaxMotionBackgroundImage {...props} />;
};

export default ParallaxBackgroundImage;
