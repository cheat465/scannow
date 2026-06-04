"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";

export default function TestSupabase() {
  const [message, setMessage] = useState("Connecting...");

  useEffect(() => {
    async function test() {
      const { data, error } = await supabase.from("orders").select("*");
      
      if (error) {
        setMessage(`❌ Error: ${error.message}`);
        console.error("Supabase error:", error);
      } else {
        setMessage(`✅ Success! Retrieved ${data.length} records`);
        console.log("Supabase data:", data);
      }
    }

    test();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Supabase Connection Test</h1>
      <p>{message}</p>
      <p>Check console for details</p>
    </div>
  );
}
