// import Image from "next/image";

// const DragDropPage = () => {
//     return (
//       <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
//         <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
//           <Image
//             className="dark:invert"
//             src="/next.svg"
//             alt="Next.js logo"
//             width={180}
//             height={38}
//             priority
//           />
//           <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
//             <li className="mb-2 tracking-[-.01em]">
//               Get started by editing{" "}
//               <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
//                 src/app/page.tsx
//               </code>
//               .
//             </li>
//             <li className="tracking-[-.01em]">
//               Save and see your changes instantly.
//             </li>
//           </ol>

//           <div className="flex gap-4 items-center flex-col sm:flex-row">
//             <a
//               className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
//               href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               target="_blank"
//               rel="noopener noreferrer"
//             >
//               <Image
//                 className="dark:invert"
//                 src="/vercel.svg"
//                 alt="Vercel logomark"
//                 width={20}
//                 height={20}
//               />
//               Deploy now
//             </a>
//             <a
//               className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
//               href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               target="_blank"
//               rel="noopener noreferrer"
//             >
//               Read our docs
//             </a>
//           </div>
//         </main>
//         <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
//           <a
//             className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//             href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               aria-hidden
//               src="/file.svg"
//               alt="File icon"
//               width={16}
//               height={16}
//             />
//             Learn
//           </a>
//           <a
//             className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//             href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               aria-hidden
//               src="/window.svg"
//               alt="Window icon"
//               width={16}
//               height={16}
//             />
//             Examples
//           </a>
//           <a
//             className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//             href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               aria-hidden
//               src="/globe.svg"
//               alt="Globe icon"
//               width={16}
//               height={16}
//             />
//             Go to nextjs.org →
//           </a>
//         </footer>
//       </div>
//     )
// }

// export default DragDropPage;


// "use client";
// import { useState } from "react";
// import {
//   DndContext,
//   closestCenter,
//   PointerSensor,
//   useSensor,
//   useSensors,
// } from "@dnd-kit/core";
// import {
//   arrayMove,
//   SortableContext,
//   verticalListSortingStrategy,
//   useSortable,
// } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
// import Image from "next/image";

// const initialImages = [
//   "image1.png",
//   "image2.png",
//   "image3.png",
//   "image4.png",
//   "image5.png",
//   "image6.png",
//   "image7.png",
//   "image8.png",
// ];

// export default function AdminPhotobooth() {
//   const [images, setImages] = useState(initialImages);
//   const sensors = useSensors(useSensor(PointerSensor));

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const handleDragEnd = (event: any) => {
//     const { active, over } = event;

//     if (!over || active.id === over.id) return;

//     const oldIndex = images.indexOf(active.id);
//     const newIndex = images.indexOf(over.id);

//     if (oldIndex !== -1 && newIndex !== -1) {
//       setImages(arrayMove(images, oldIndex, newIndex));
//     }
//   };

//   const leftImages = images.slice(0, 4);
//   const rightImages = images.slice(4, 8);

//   return (
//     <div className="min-h-screen p-8 bg-gray-100 text-black">
//       <h1 className="text-2xl font-bold mb-6">Photobooth Admin Drag & Drop</h1>

//       <DndContext
//         sensors={sensors}
//         collisionDetection={closestCenter}
//         onDragEnd={handleDragEnd}
//       >
//         <SortableContext items={images} strategy={verticalListSortingStrategy}>
//           <div className="grid grid-cols-2 gap-8">
//             <Column title="Kiri" items={leftImages} />
//             <Column title="Kanan" items={rightImages} />
//           </div>
//         </SortableContext>
//       </DndContext>

//       <div className="mt-8 bg-white p-4 rounded shadow">
//         <h2 className="text-lg font-semibold mb-2">Output JSON</h2>
//         <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
//           {JSON.stringify(
//             {
//               left: images.slice(0, 4),
//               right: images.slice(4, 8),
//             },
//             null,
//             2
//           )}
//         </pre>
//       </div>
//     </div>
//   );
// }

// function Column({ title, items }: { title: string; items: string[] }) {
//   return (
//     <div className="bg-white p-4 rounded shadow min-h-[300px]">
//       <h2 className="text-xl font-semibold mb-4">{title}</h2>
//       <div className="flex flex-col gap-4">
//         {items.map((id) => (
//           <SortableItem key={id} id={id} />
//         ))}
//       </div>
//     </div>
//   );
// }

// function SortableItem({ id }: { id: string }) {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//     isDragging,
//   } = useSortable({ id });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     opacity: isDragging ? 0.5 : 1,
//     cursor: "grab",
//   };

//   return (
//     <div
//       ref={setNodeRef}
//       style={style}
//       {...attributes}
//       {...listeners}
//       className="bg-gray-200 rounded p-2 flex justify-center items-center"
//     >
//       <Image
//         src={`/frames/${id}`}
//         alt={id}
//         width={100}
//         height={100}
//         className="rounded"
//       />
//     </div>
//   );
// }


"use client";
import { useState } from "react";
import {
  DndContext,              // Area utama drag-and-drop
  PointerSensor,           // Sensor untuk mouse
  useSensor, useSensors,   // Aktifkan sensor
  closestCenter,           // Deteksi posisi drag terdekat
} from "@dnd-kit/core";

import {
  SortableContext,             // Buat daftar item bisa diurutkan
  verticalListSortingStrategy, // Strategi urutan vertikal
  useSortable,                 // Hook agar item bisa di-drag
  arrayMove                    // Untuk ubah urutan array
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";

export default function AdminPhotobooth() {
  // Data awal gambar
  const initialImages = [
    "image1.png",
    "image2.png",
    "image3.png",
    "image4.png",
    "image5.png",
    "image6.png",
    "image7.png",
    "image8.png",
  ];

  // State utama untuk menyimpan urutan gambar
  const [images, setImages] = useState(initialImages);

  // Aktifkan sensor drag pakai mouse
  const sensors = useSensors(useSensor(PointerSensor));

  // Fungsi ketika drag selesai
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = images.indexOf(active.id);
    const newIndex = images.indexOf(over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setImages(arrayMove(images, oldIndex, newIndex)); // Atur ulang urutan
    }
  };

  // Bagi gambar menjadi kiri dan kanan
  const leftImages = images.slice(0, 4);
  const rightImages = images.slice(4, 8);

  // Komponen item drag
  const SortableItem = ({ id }: { id: string }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      cursor: "grab",
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-gray-200 rounded p-2 flex justify-center items-center h-52"
      >
        <Image
          src={`/images/${id}`}
          alt={id}
          width={100}
          height={100}
          className="rounded h-full w-full bg-fill bg-no-repeat bg-center"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 text-black">
      <h1 className="text-2xl font-bold mb-6">Photobooth Admin Drag & Drop</h1>

      {/* Area utama drag and drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* Daftar item yang bisa di-drag */}
        <SortableContext items={images} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-2 gap-8">
            {/* Kolom Kiri */}
            <div className="bg-white p-4 rounded shadow min-h-[300px]">
              <h2 className="text-xl font-semibold mb-4">Kiri</h2>
              <div className="flex flex-col gap-4">
                {leftImages.map((id) => (
                  <SortableItem key={id} id={id} />
                ))}
              </div>
            </div>

            {/* Kolom Kanan */}
            <div className="bg-white p-4 rounded shadow min-h-[300px]">
              <h2 className="text-xl font-semibold mb-4">Kanan</h2>
              <div className="flex flex-col gap-4">
                {rightImages.map((id) => (
                  <SortableItem key={id} id={id} />
                ))}
              </div>
            </div>
          </div>
        </SortableContext>
      </DndContext>

      {/* Output JSON */}
      <div className="mt-8 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Output JSON</h2>
        <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
          {JSON.stringify(
            {
              left: leftImages,
              right: rightImages,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}