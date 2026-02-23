import React, { useEffect } from "react"; // 1. Tambahkan useEffect di sini
import { Card, Avatar, Typography, Row, Col } from "antd";
import {
    GithubOutlined,
    InstagramOutlined,
    MailOutlined,
} from "@ant-design/icons";
import Footer from "../../../components/Footer";

const { Title, Paragraph } = Typography;

// ===================== DEVELOPER DATA =====================
const developers = [
    // ... data developer tetap sama ...
    {
        name: "Aditya Gunawan",
        role: "Fullstack Developer",
        tech: "React, Tailwind, Flask, MySQL",
        img: "src/assets/images/adit.png",
        ig: "https://www.instagram.com/adit.g777?igsh=Yzd2MTIwZDdodjQ%3D&utm_source=qr",
        email: "adityadewa777@gmail.com",
        github: "https://github.com/darth-sky",
    },
    {
        name: "Candra Dipasanti",
        role: "Frontend Developer",
        tech: "React.js, Ant Design",
        img: "src/assets/images/candra.png",
        ig: "https://www.instagram.com/candradipasantii?igsh=ZjVxNzNjZTl3ajlp&utm_source=qr",
        email: "dipacandrasanti2@gmail.com",
        github: "https://github.com/CandraDipasantii",
    },
    {
        name: "Diah Pramesti",
        role: "UI/UX & Frontend Developer",
        tech: "Figma, Adobe XD",
        img: "src/assets/images/diah.png",
        ig: "https://www.instagram.com/gdyahh_?igsh=MThkczNibXk2bGhy",
        email: "gungdiahpram5@gmail.com",
        github: "https://github.com/gungdiahpramesti",
    },
    {
        name: "Restha Aristita",
        role: "Backend Developer",
        tech: "Node.js, Express, MySQL",
        img: "src/assets/images/resta.png",
        ig: "https://www.instagram.com/ithaa.pm?igsh=MXViNjhyanAxcHBqbA==",
        email: "restha03@gmail.com",
        github: "https://github.com/ResthaAri",
    },
];

const AboutUs = () => {
    
    // 2. Logika untuk memuat script Elfsight
    useEffect(() => {
        const scriptUrl = "https://elfsightcdn.com/platform.js";
        
        // Cek apakah script sudah ada agar tidak duplikat
        if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
            const script = document.createElement("script");
            script.src = scriptUrl;
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    return (
        <div className="min-h-screen p-6 md:p-10 bg-transparent flex flex-col items-center">

            {/* ================= HEADER ================= */}
            <div className="text-center max-w-3xl mx-auto">
                <Title level={1} className="!mb-3 !text-4xl md:!text-5xl">About Us</Title>
                <Paragraph className="text-gray-600 text-lg md:text-xl">
                    Dago Creative Hub — tempat di mana kreativitas tumbuh, peluang terbuka, dan pengalaman Anda menjadi prioritas.
                </Paragraph>
            </div>

            {/* ================= MAIN CONTENT ================= */}
            <Row
                gutter={[32, 32]}
                className="mt-12 max-w-6xl w-full flex justify-center items-center"
                align="middle"
            >
                <Col xs={24} md={12} className="flex justify-center">
                    <img
                        src="src/assets/images/tempat.jpeg"
                        alt="Dago"
                        className="rounded-2xl shadow-xl w-full max-w-[550px] object-cover"
                    />
                </Col>

                <Col xs={24} md={12}>
                    <Card className="shadow-lg !rounded-2xl border border-gray-200 w-full">
                        <Paragraph className="text-gray-700 text-justify leading-relaxed">
                            Dago Creative Hub adalah ruang kreatif yang menyediakan berbagai layanan untuk mendukung kebutuhan Anda, mulai dari F&B, penyewaan ruang kerja, virtual office, hingga pemesanan ruang untuk acara. Kami hadir untuk memberikan pengalaman yang lebih mudah, cepat, dan nyaman melalui sistem pemesanan berbasis web yang terintegrasi.
                            Dengan layanan yang kini tersambung langsung ke sistem kami, Anda dapat melakukan pemesanan makanan, booking ruangan, hingga pendaftaran membership secara praktis tanpa proses manual. Semua transaksi tercatat otomatis, sehingga lebih aman, transparan, dan efisien.
                        </Paragraph>

                        <Paragraph className="text-gray-700 text-justify leading-relaxed mt-4">
                            Kami terus berinovasi agar setiap kunjungan Anda—baik sebagai pelanggan maupun tenant—menjadi lebih menyenangkan dan bebas hambatan. Dago Creative Hub adalah tempat di mana kreativitas dipermudah, produktivitas didukung, dan pengalaman Anda menjadi prioritas.
                        </Paragraph>
                    </Card>
                </Col>
            </Row>

            {/* ================= GOOGLE REVIEWS SECTION ================= */}
            {/* 3. Letakkan Div Elfsight di sini dengan wrapper agar rapi */}
            <div className="max-w-6xl w-full mx-auto mt-20">
                <Title level={2} className="text-center !mb-8">What They Say</Title>
                <div className="elfsight-app-7f633199-931c-4e16-abae-26d550ad11b1" data-elfsight-app-lazy></div>
            </div>

            {/* ================= DEVELOPER SECTION ================= */}
            <div className="max-w-6xl w-full mx-auto mt-20">
                <Title level={2} className="text-center !mb-8">Developer Information</Title>

                <Row gutter={[24, 24]} justify="center">
                    {developers.map((dev, index) => (
                        <Col key={index} xs={24} sm={12} md={12} lg={6}>
                            <Card
                                className="shadow-lg !rounded-2xl text-center p-4 border border-gray-200 
                                h-full flex flex-col items-center"
                            >
                                <Avatar size={120} src={dev.img} className="mx-auto shadow-md" />
                                <Title level={4} className="!mt-4 !mb-1">{dev.name}</Title>
                                <Paragraph className="text-gray-700 !mb-1">
                                    <strong>Role:</strong> {dev.role}
                                </Paragraph>
                                <Paragraph className="text-gray-700 !mb-3">
                                    <strong>Tech:</strong> {dev.tech}
                                </Paragraph>
                                <div className="flex-grow"></div>
                                <div className="flex justify-center gap-4 text-xl mt-auto">
                                    <a href={dev.github} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-600">
                                        <GithubOutlined />
                                    </a>
                                    <a href={dev.ig} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-pink-600">
                                        <InstagramOutlined />
                                    </a>
                                    <a href={`mailto:${dev.email}`} className="text-gray-700 hover:text-red-600">
                                        <MailOutlined />
                                    </a>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
                <Footer className="mt-20" />
            </div>
        </div>
    );
};

export default AboutUs;