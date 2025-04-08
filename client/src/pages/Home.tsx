export interface IHomeProps {
}

export default function Home (props: IHomeProps) {
  console.log("Home Page");
  return (
    <>
        <h1 className="text-2xl font-bold text-white mb-4">Welcome to your Budget App</h1>
        <p className="text-white mb-4">This is a simple budget app that allows you to track your income and expenses.</p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md">Get Started</button>
    </>
  );
}
