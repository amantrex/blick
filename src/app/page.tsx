export default function Home() {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="max-w-xl w-full text-center space-y-4">
        <h1 className="text-3xl font-semibold">Blick</h1>
        <p className="text-gray-600">WhatsApp-first fee collection for small schools and clinics.</p>
        <a href="/signin" className="inline-block bg-black text-white rounded px-4 py-2">Sign In</a>
      </div>
    </div>
  );
}
