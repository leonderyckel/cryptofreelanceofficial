"use client";

import { useState } from "react";
import { useSignerStatus, useUser, useConnect, useLogout } from "@account-kit/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugConnection() {
  const signerStatus = useSignerStatus();
  const user = useUser();
  const { connectors, connect, isPending } = useConnect();
  const { logout } = useLogout();
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);

  console.log("Debug - Signer Status:", signerStatus);
  console.log("Debug - User:", user);
  console.log("Debug - Connectors:", connectors);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Debug Connection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm"><strong>Connected:</strong> {signerStatus.isConnected ? "Yes" : "No"}</p>
          <p className="text-sm"><strong>Status:</strong> {signerStatus.status}</p>
          <p className="text-sm"><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : "None"}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">Available Connectors:</p>
          {connectors?.map((connector) => (
            <div key={connector.id} className="flex items-center gap-2 mb-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log("Connecting to:", connector);
                  setSelectedConnector(connector.id);
                  connect({ connector });
                }}
                disabled={isPending}
              >
                {isPending && selectedConnector === connector.id ? "Connecting..." : `Connect ${connector.name}`}
              </Button>
            </div>
          ))}
        </div>

        {signerStatus.isConnected && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => logout()}
          >
            Disconnect
          </Button>
        )}
      </CardContent>
    </Card>
  );
}