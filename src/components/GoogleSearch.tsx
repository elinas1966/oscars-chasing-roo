import { useEffect } from 'react';

export const GoogleSearch = () => {
  useEffect(() => {
    // Load the Google Custom Search script
    const script = document.createElement('script');
    script.src = "https://cse.google.com/cse.js?cx=71d8392659e0f48a2";
    script.async = true;
    document.head.appendChild(script);

    // Cleanup function to remove the script when component unmounts
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto my-8 px-4">
      <div className="gcse-search"></div>
    </div>
  );
};