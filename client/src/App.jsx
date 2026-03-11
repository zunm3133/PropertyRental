import HomePage from "./routes/homePage/homePage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ListPage from "./routes/listPage/listPage";
import { Layout, RequireAuth } from "./routes/layout/layout";
import SinglePage from "./routes/singlePage/singlePage";
import ProfilePage from "./routes/profilePage/profilePage";
import Login from "./routes/login/login";
import Register from "./routes/register/register";
import ProfileUpdatePage from "./routes/profileUpdatePage/profileUpdatePage";
import NewPostPage from "./routes/newPostPage/newPostPage";
import UpdatePage from "./routes/updatePage/updatePage";
import AdminDashboard from "./routes/admin/adminDashboard";
import ForgotPassword from "./routes/forgotPassword/ForgotPassword";
import ResetPassword from "./routes/resetPassword/ResetPassword";
import { listPageLoader, profilePageLoader, singlePageLoader } from "./lib/loaders";
import FlaggedMessages from "./routes/admin/FlaggedMessages";
import ContactPage from "./routes/contactPage/ContactPage";
import AboutPage from "./routes/aboutPage/AboutPage";
function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <HomePage />,
        },
        {
          path: "/list",
          element: <ListPage />,
          loader: listPageLoader,
        },
        {
          path: "/:id",
          element: <SinglePage />,
          loader: singlePageLoader,
        },

        {
          path: "/login",
          element: <Login />,
        },
        {
          path: "/register",
          element: <Register />,
        },
        {
          path: "/forgot-password",
          element: <ForgotPassword />,
        },
        {
          path: "/reset-password",
          element: <ResetPassword />,
        },
        {
          path: "/list/:id/update", 
          element: <UpdatePage />,
           loader: singlePageLoader 
        },
       {
           path: "/admin",
            element: <AdminDashboard />
      },
      {
           path: "/admin/flagged",
            element: <FlaggedMessages />
      },
      {
           path: "/contact",
            element: <ContactPage />
      },
      {
           path: "/about",
            element: <AboutPage />
      }
      ],
    },
    {
      path: "/",
      element: <RequireAuth />,
      children: [
        {
          path: "/profile",
          element: <ProfilePage />,
          loader: profilePageLoader
        },
        {
          path: "/profile/update",
          element: <ProfileUpdatePage />,
        },
        {
          path: "/add",
          element: <NewPostPage />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
