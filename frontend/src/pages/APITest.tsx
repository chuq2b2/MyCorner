import { useUser } from "@clerk/clerk-react";
import { useState } from "react";

const APITest = () => {
  const { user } = useUser();
  const [responseMessage, setResponseMessage] = useState("");

  const testAPICall = async () => {
    if (!user) {
      console.error("User not found!");
      setResponseMessage("User not found!");
      return;
    }

    const userData = {
      id: user.id,
      email: user.emailAddresses[0].emailAddress,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      console.log("API Response:", result);
      setResponseMessage(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("API Error:", error);
      setResponseMessage("API request failed!");
    }
  };

  return (
    <div>
      <button onClick={testAPICall}>Test API Call</button>
      <pre>{responseMessage}</pre>
    </div>
  );
};

export default APITest;