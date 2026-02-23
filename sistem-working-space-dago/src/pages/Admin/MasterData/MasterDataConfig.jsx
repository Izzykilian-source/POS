import {
    UserOutlined,
    ShopOutlined,
} from "@ant-design/icons";
import {
    MessageCircleQuestion
} from "lucide-react"

// Import tab pages (Yang aktif untuk F&B)
import UserTab from "./tabs/UserTab";
import TenantTab from "./tabs/TenantTab";
import ProductKategoriTab from "./tabs/ProductKategoriTab";
import ProductTab from "./tabs/ProductTab";
import PromoTab from "./tabs/PromoTab";
import CoaadminTab from "./tabs/CoaadminTab";
import FAQTab from "./tabs/FAQtab";
import SettingsTab from "./tabs/SettingsTab";

// === IMPORT WORKING SPACE DI-HIDE ===
// import RuanganKategoriTab from "./tabs/RuanganKategoriTab";
// import RuanganTab from "./tabs/RuanganTab";
// import PaketMembershipTab from "./tabs/PaketMembershipTab";
// import VirtualOfficePackageTab from "./tabs/VirtualOfficePackageTab";
// import EventSpacesTab from "./tabs/EventSpacesTab";
// import AcaraTab from "./tabs/AcaraTab";

import { AiOutlineProduct } from "react-icons/ai";
import { MdOutlineProductionQuantityLimits, MdDiscount, MdSettings, MdBook } from "react-icons/md";
// === IMPORT ICON WORKING SPACE DI-HIDE ===
// import { MdChair, MdCardMembership, MdEvent, MdEventAvailable } from "react-icons/md";
// import { GiPostOffice } from "react-icons/gi";

// Konfigurasi tab
export const tabsConfig = [
    {
        key: "user",
        path: "user",
        label: "User",
        icon: UserOutlined,
        component: <UserTab />,
    },
    {
        key: "tenant",
        path: "tenant",
        label: "Tenant",
        icon: ShopOutlined,
        component: <TenantTab />,
    },
    {
        key: "productkategori",
        path: "productkategori",
        label: "Kategori Produk",
        icon: AiOutlineProduct,
        component: <ProductKategoriTab />,
    },
    {
        key: "product",
        path: "product",
        label: "Produk",
        icon: MdOutlineProductionQuantityLimits,
        component: <ProductTab />,
    },

    // =========================================================
    // TAB WORKING SPACE DI-HIDE (TIDAK MUNCUL DI LAYAR ADMIN)
    // =========================================================
    // {
    //     key: "ruangankategori",
    //     path: "ruangankategori",
    //     label: "Kategori Ruangan",
    //     icon: AiOutlineProduct,
    //     component: <RuanganKategoriTab />,
    // },
    // {
    //     key: "ruangan",
    //     path: "ruangan",
    //     label: "Ruangan",
    //     icon: MdChair,
    //     component: <RuanganTab />,
    // },
    // {
    //     key: "paketmembership",
    //     path: "paketmembership",
    //     label: "Paket Membership",
    //     icon: MdCardMembership,
    //     component: <PaketMembershipTab />,
    // },
    // {
    //     key: "paketvirtualoffice",
    //     path: "paketvirtualoffice",
    //     label: "Paket Virtual Office",
    //     icon: GiPostOffice,
    //     component: <VirtualOfficePackageTab />,
    // },
    // {
    //     key: "eventspaces",
    //     path: "eventspaces",
    //     label: "Event Spaces",
    //     icon: MdEventAvailable,
    //     component: <EventSpacesTab />,
    // },
    // {
    //     key: "acara",
    //     path: "acara",
    //     label: "Acara",
    //     icon: MdEvent,
    //     component: <AcaraTab />,
    // },
    // =========================================================

    {
        key: "promo",
        path: "promo",
        label: "Promo",
        icon: MdDiscount,
        component: <PromoTab />,
    },
    {
        key: "COA",
        path: "COA",
        label: "COA",
        icon: MdBook,
        component: <CoaadminTab />,
    },
    {
        key: "FAQtab",
        path: "FAQtab",
        label: "FAQ",
        icon: MessageCircleQuestion,
        component: <FAQTab />,
    },
    {
        key: "settings",
        path: "settings",
        label: "settings",
        icon: MdSettings,
        component: <SettingsTab />,
    },
];

// Helper untuk inisialisasi data awal
export const initialDataSources = tabsConfig.reduce((acc, tab) => {
    acc[tab.key] = tab.initialData || [];
    return acc;
}, {});