import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireAuth } from "react-auth-kit";
import { Welcome, Error, SignIn, SignUp, Reservation, Testing, CreateReservation, UpdateReservation, ViewReservation, Equipment } from "./pages";

const App = () => {
  return (
    <AuthProvider
      authType="cookie"
      authName="_auth"
      cookieDomain={window.location.hostname}
      cookieSecure={true}
    >
      <BrowserRouter basename="/">
        <Routes>
          <Route path="/testing/:id" element={<Testing />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/about" element={<Welcome/>} />
          <Route path="" element={<Welcome />} />
          <Route path="*" element={<Error />} />
          <Route path="/equipment" element={<RequireAuth loginPath={'/login'}><Equipment/></RequireAuth>} />
          <Route path="/createreservation" element={<RequireAuth loginPath={'/login'}><CreateReservation/></RequireAuth>} />
          <Route path="/updatereservation/:id" element={<RequireAuth loginPath={'/loginn'}><UpdateReservation/></RequireAuth>} />
          <Route path="/viewreservation/:id" element={<RequireAuth loginPath={'/login'}><ViewReservation/></RequireAuth>} />
          <Route path="/reservation" element={<RequireAuth loginPath={'/login'}><Reservation/></RequireAuth>} />
          <Route path="/equipment" element={<RequireAuth loginPath={'/login'}><Welcome/></RequireAuth>} />
          <Route path="/administration" element={<RequireAuth loginPath={'/login'}><Welcome/></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
