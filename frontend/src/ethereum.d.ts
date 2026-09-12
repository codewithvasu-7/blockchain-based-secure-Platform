interface Window {
  ethereum?: {
    on: {
      (event: "accountsChanged", handler: (accounts: string[]) => void): void;
      (event: "chainChanged", handler: () => void): void;
    };
    removeListener?: {
      (event: "accountsChanged", handler: (accounts: string[]) => void): void;
      (event: "chainChanged", handler: () => void): void;
    };
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  };
}
