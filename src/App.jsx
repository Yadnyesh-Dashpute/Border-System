import React, { useState } from "react";

import Loader from "./Components/Loader/Loader";
import Landing from "./Pages/Landing";
import Squares from "./Components/Background/GridBackground";

const App = () => {
  const [loading, setLoading] = useState(true);

  return (
    <>

      {loading ? (
        <Loader onEnd={() => setLoading(false)} />
      ) : (
        <Landing />
      )}

    </>
  );
};

export default App;
