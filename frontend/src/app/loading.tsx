export default function Loading() {
  return (
    <div className="w-full animate-pulse space-y-8 p-4 sm:p-0">
      {/* Header/Banner Placeholder */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
        <div className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] rounded-full bg-gray-200 flex-shrink-0"></div>
        <div className="flex flex-col gap-4 w-full max-w-xl">
          <div className="h-10 sm:h-12 bg-gray-200 rounded-xl w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded-md w-full"></div>
          <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
        </div>
      </div>
      
      {/* Title placeholder */}
      <div className="h-8 bg-gray-200 rounded-lg w-48 mt-4"></div>
      
      {/* Grid or Content placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-[250px] bg-gray-200 rounded-2xl"></div>
        <div className="h-[250px] bg-gray-200 rounded-2xl"></div>
        <div className="h-[250px] bg-gray-200 rounded-2xl hidden lg:block"></div>
      </div>
    </div>
  );
}
