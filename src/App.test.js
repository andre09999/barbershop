import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { PlatformProvider } from "./context/PlatformContext";

test("renderiza a proposta principal da plataforma", () => {
  const markup = renderToString(
    <MemoryRouter initialEntries={["/"]}>
      <PlatformProvider>
        <App />
      </PlatformProvider>
    </MemoryRouter>
  );

  expect(markup).toContain("Mais organização para você");
  expect(markup).toContain("AgendaPro");
});
