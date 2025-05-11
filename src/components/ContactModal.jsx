import * as Dialog from '@radix-ui/react-dialog'

export default function ContactModal() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <a className="hover:text-gray-900 transition cursor-pointer">Contact</a>
      </Dialog.Trigger>


      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold mb-4">CONTACT ME</Dialog.Title>
          <form action="https://formspree.io/f/xjkwebll" method="POST" className="flex flex-col space-y-4">
            <input name="name" type="text" placeholder="Your name" required className="border px-3 py-2 rounded-md" />
            <input name="email" type="email" placeholder="Your email" required className="border px-3 py-2 rounded-md" />
            <textarea name="message" placeholder="Your message..." rows="4" required className="border px-3 py-2 rounded-md" />
            <button type="submit" className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">Send</button>
          </form>
          <Dialog.Close asChild>
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
              aria-label="Close contact modal"
            >
              &times;
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}