import white from "../assets/videosdk-wordmark-white.svg";
import black from "../assets/videosdk-wordmark-black.svg";

// VideoSDK wordmark: white on the dark theme, black on light.
export function Logo({ className = "h-4" }: { className?: string }) {
  return (
    <>
      <img src={white} alt="VideoSDK" className={`hidden dark:block ${className}`} />
      <img src={black} alt="VideoSDK" className={`dark:hidden ${className}`} />
    </>
  );
}
