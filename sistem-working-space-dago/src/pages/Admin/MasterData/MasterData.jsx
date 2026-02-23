import React from "react";
import { Button, Typography, Badge, Card } from "antd";
import { CalendarOutlined, DatabaseOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { tabsConfig } from "./MasterDataConfig";

const { Title, Text } = Typography;

const MasterData = () => {
  const { tabKey } = useParams();
  const navigate = useNavigate();

  // Aktif tab berdasarkan URL params
  const activeTabConfig =
    tabsConfig.find((tab) => tab.path === tabKey) || tabsConfig[0];
  const activeTab = activeTabConfig.key;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <Title
                level={3}
                className="!mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                Master Data POS
              </Title>
              <Text className="text-gray-500">
                Kelola semua data master sistem POS
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-8">
        {/* Tab Buttons */}
        <div className="border-b border-gray-200 bg-white px-8 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <Button
                  key={tab.key}
                  type="text"
                  onClick={() => navigate(`/masterdataadmin/${tab.path}`)}
                  className={`flex items-center !px-4 !h-12 !rounded-none transition-colors duration-200
                    border-b-2 
                    ${isActive
                      ? "font-semibold !text-blue-600 "
                      : "text-gray-500 border-transparent hover:!bg-gray-100 hover:!border-gray-300"
                    }`}
                  icon={
                    <Icon
                      className={isActive ? "!text-blue-600" : "text-gray-500"}
                    />
                  }
                >
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">{activeTabConfig.component}</div>
      </div>
    </div>

  );
};

export default MasterData;