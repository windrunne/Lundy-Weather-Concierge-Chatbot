import Chat from "./components/Chat";
import Header from "./components/Header";

const App = () => {
  return (
    <div className="min-h-screen text-slate-100 md:h-screen flex flex-col overflow-hidden">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-6 flex-grow overflow-y-auto">
        <Chat />
      </main>
    </div>
  );
};

export default App;

