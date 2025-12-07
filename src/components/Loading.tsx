"use client";

import PyramidAnimation from "@/components/ui/ascii-pyramid";

const Loading = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center bg-black">
      <PyramidAnimation
        edges={false}
      />
    </div>
  );
};

export default Loading;