import * as Dialog from '@radix-ui/react-dialog'

export default function ResumeModal() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <a className="hover:text-gray-900 transition cursor-pointer">Resume</a>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-3xl h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-4 shadow-lg overflow-hidden flex flex-col"
        >
          <Dialog.Title className="text-lg font-semibold mb-2">MY RESUME</Dialog.Title>

          <Dialog.Close asChild>
            <button
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
            >
            &times;
            </button>
          </Dialog.Close>

          <div className="flex-1 overflow-y-auto border rounded">
            <iframe
              src="/resume.pdf"
              title="Resume"
              className="w-full h-full rounded"
              style={{ minHeight: '100%' }}
            ></iframe>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <a
              href="/resume.pdf"
              download
              className="text-sm text-white bg-black px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              Download PDF
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}