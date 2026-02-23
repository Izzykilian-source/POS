import { CheckCircleFilled } from "@ant-design/icons";
import { Typography } from "antd";
import { parseFeatures } from "../utils/parseFeature";

const { Text } = Typography;

export default function FeatureList({ featureString }) {
  const features = parseFeatures(featureString);

  return (
    <ul style={{ paddingLeft: 0, listStyle: "none" }}>
      {features.map((f, i) => (
        <li key={i} style={{ marginBottom: "4px" }}>
          <CheckCircleFilled style={{ color: "#1890ff", marginRight: "8px" }} />
          <Text>{f}</Text>
        </li>
      ))}
    </ul>
  );
}
