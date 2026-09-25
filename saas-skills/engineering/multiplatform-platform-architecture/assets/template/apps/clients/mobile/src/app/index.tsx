import { ScrollView } from "react-native";
import { HomePage } from "@acme/frontend/pages/home";

export default function HomeScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <HomePage />
    </ScrollView>
  );
}
