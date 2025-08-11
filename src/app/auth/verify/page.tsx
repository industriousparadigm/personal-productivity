export default function Verify() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Check your email</h1>
          <p className="mt-2 text-gray-600">
            A sign-in link has been sent to your email address.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Click the link in your email to sign in to Oathkeeper.
          </p>
        </div>
      </div>
    </div>
  );
}