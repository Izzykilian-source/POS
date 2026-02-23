import { Sidebar } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import SidebarKasir from "./sidebar";
import { AuthContext } from "../../providers/AuthProvider";
import { useNavigate } from "react-router-dom";

function MainKasir({ children }) {
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);
  console.log(userProfile);

  useEffect(() => {
    if (userProfile.roles !== "kasir") {
      navigate("/");
    }
  }, [userProfile]);

  const [selectedMenu, setSelectedMenu] = useState("Dashboard");

  const menuItems = [
    { name: "Mengelola Orderan", icon: "📊", path: "/mengelola-orderan_fb" },
    {
      name: "Mengelola Booking Ruangan",
      icon: "📋",
      path: "/mengelola-booking-ruangan",
    },
  ];
  return (
    <>
      <div className="flex min-h-screen bg-gray-100">
        <SidebarKasir
          menuItems={menuItems}
          selectedMenu={selectedMenu}
          setSelectedMenu={setSelectedMenu}
        />

        <div className="flex-1 p-6">{children}</div>
      </div>
    </>
  );
}

export default MainKasir;
