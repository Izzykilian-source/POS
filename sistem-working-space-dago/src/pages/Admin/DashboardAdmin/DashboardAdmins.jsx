import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { Card, Table, Spin, Alert, DatePicker, Row, Col, Typography } from "antd";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement,
} from "chart.js";
import { getAdminDashboardData } from "../../../services/service";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Title } = Typography;

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement
);

// Helper to format chart data (no changes needed)
const formatChartData = (label, data, backgroundColors, labelName) => ({
  labels: data.map(d => d[label]),
  datasets: [
    {
      label: labelName,
      data: data.map(d => d.value),
      backgroundColor: backgroundColors,
    },
  ],
});

const DashboardAdmins = () => {
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  
  // State for the date range, defaults to the current month
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  useEffect(() => {
    // Redirect if not an admin
    if (userProfile && userProfile.roles !== "admin_dago") {
      navigate("/");
    }
  }, [userProfile, navigate]);

  // useEffect now depends on the dateRange to refetch data
  useEffect(() => {
    if (userProfile && userProfile.roles === "admin_dago" && dateRange && dateRange.length === 2) {
      const fetchData = async () => {
        try {
          setLoading(true);
          // Format dates to YYYY-MM-DD before sending to the service
          const startDate = dateRange[0].format('YYYY-MM-DD');
          const endDate = dateRange[1].format('YYYY-MM-DD');

          const data = await getAdminDashboardData(startDate, endDate);
          setDashboardData(data);
          setError(null);
        } catch (err) {
          setError("Gagal memuat data dasbor. Pastikan Anda terhubung ke server.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [userProfile, dateRange]); // Dependency array updated

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spin size="large" tip="Memuat data..." /></div>;
  }

  if (error) {
    return <div className="p-6"><Alert message="Error" description={error} type="error" showIcon /></div>;
  }

  if (!dashboardData) {
    return (
        <div className="p-6 text-center">
            <Alert message="Tidak ada data untuk ditampilkan pada rentang tanggal yang dipilih." type="info" />
        </div>
    );
  }

  // Prepare data for charts (no changes needed in logic)
  const topSaleData = formatChartData("name", dashboardData.tenantSales, ["#36A2EB", "#FF6384", "#FFCE56"], "Penjualan (IDR)");
  const categoryData = formatChartData("name", dashboardData.categorySales, ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"], "Penjualan (IDR)");
  
  const dailySelling = {
    labels: dashboardData.dailySelling.labels,
    datasets: [{
      label: "Penjualan Harian (IDR)",
      data: dashboardData.dailySelling.data,
      borderColor: "#FF6384",
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      fill: true,
    }],
  };
  
  const monthlySummary = {
    labels: dashboardData.monthlySummary.labels,
    datasets: [{
      label: "Penjualan Bulanan (IDR)",
      data: dashboardData.monthlySummary.data,
      backgroundColor: "#4BC0C0",
    }],
  };

  const topProductsColumns = [
    { title: "Merchant", dataIndex: "merchant", key: "merchant" },
    { title: "Item", dataIndex: "item", key: "item" },
    { title: "Qty", dataIndex: "qty", key: "qty" },
    { title: "Total (IDR)", dataIndex: "total", key: "total", render: (val) => parseInt(val).toLocaleString('id-ID') },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen overflow-y-auto">
      
      {/* Header with DatePicker */}
      <Row justify="space-between" align="middle" className="mb-6">
          <Col>
              <Title level={2}>Admin Dashboard</Title>
          </Col>
          <Col>
              <RangePicker 
                  value={dateRange} 
                  onChange={setDateRange}
                  // Useful presets for quick selection
                  presets={[
                      { label: 'Hari Ini', value: [dayjs(), dayjs()] },
                      { label: 'Bulan Ini', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
                      { label: 'Tahun Ini', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
                      { label: '7 Hari Terakhir', value: [dayjs().subtract(6, 'd'), dayjs()] },
                      { label: '30 Hari Terakhir', value: [dayjs().subtract(29, 'd'), dayjs()] },
                  ]}
              />
          </Col>
      </Row>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-md">
          <h2 className="text-xl font-bold mb-4">
            Total Penjualan: Rp {dashboardData.topSaleTotal.toLocaleString('id-ID')}
          </h2>
          <Pie data={topSaleData} />
        </Card>
        <Card className="shadow-md">
          <h2 className="text-lg font-semibold mb-4">Penjualan per Kategori</h2>
          <Pie data={categoryData} />
        </Card>
        <Card className="shadow-md overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Top 10 Produk</h2>
          <Table dataSource={dashboardData.topProducts} columns={topProductsColumns} pagination={false} size="small" rowKey="item" />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <h2 className="text-lg font-semibold mb-4">Penjualan Harian</h2>
          <Line data={dailySelling} />
        </Card>
        <Card className="shadow-md">
          <h2 className="text-lg font-semibold mb-4">Ringkasan Penjualan (6 Bulan Terakhir)</h2>
          <Bar data={monthlySummary} />
        </Card>
      </div>
    </div>
  );
};

export default DashboardAdmins;
