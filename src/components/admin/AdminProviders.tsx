"use client";

import "@ant-design/v5-patch-for-react-19";
import { StyleProvider } from "@ant-design/cssinjs";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";
import type { ReactNode } from "react";

const theme = {
  token: {
    colorPrimary: "#155547",
    colorInfo: "#155547",
    colorSuccess: "#155547",
    colorWarning: "#8a5a12",
    colorError: "#9f2d2d",
    colorLink: "#155547",
    colorText: "#2a2a2a",
    colorTextSecondary: "#5c5854",
    colorBorder: "#e4e0d8",
    colorBorderSecondary: "#efece6",
    colorBgLayout: "#f6f3ed",
    colorBgContainer: "#ffffff",
    colorFillAlter: "#fbfaf7",
    borderRadius: 8,
    borderRadiusLG: 10,
    fontFamily: "var(--font-sans), 'Source Sans 3', sans-serif",
    fontSize: 15,
    fontSizeSM: 14,
    fontSizeLG: 16,
    controlHeight: 42,
    lineHeight: 1.5,
    boxShadow: "none",
    boxShadowSecondary: "0 1px 2px rgba(42, 42, 42, 0.06)",
    boxShadowTertiary: "none",
  },
  components: {
    Button: {
      controlHeight: 42,
      primaryShadow: "none",
      dangerShadow: "none",
      defaultShadow: "none",
      fontWeight: 500,
      paddingInline: 16,
      borderRadius: 8,
    },
    Input: {
      controlHeight: 42,
      activeShadow: "0 0 0 3px rgba(21, 85, 71, 0.14)",
      borderRadius: 8,
    },
    Select: {
      controlHeight: 42,
      borderRadius: 8,
    },
    Segmented: {
      itemSelectedBg: "#ffffff",
      itemSelectedColor: "#155547",
      trackBg: "#efece6",
      trackPadding: 4,
    },
    Table: {
      headerBg: "#fbfaf7",
      headerColor: "#5c5854",
      headerSplitColor: "transparent",
      rowHoverBg: "#f6f3ed",
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
      borderColor: "#efece6",
      headerBorderRadius: 10,
    },
    Card: {
      headerFontSize: 16,
      paddingLG: 20,
    },
    Modal: {
      borderRadiusLG: 10,
      titleFontSize: 18,
      titleLineHeight: 1.4,
    },
    Form: {
      labelFontSize: 15,
      itemMarginBottom: 16,
      verticalLabelPadding: "0 0 6px",
    },
    Switch: {
      colorPrimary: "#155547",
    },
    Dropdown: {
      borderRadiusLG: 10,
    },
  },
};

export function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <AntdRegistry>
      <StyleProvider layer>
        <ConfigProvider locale={esES} theme={theme}>
          <App>{children}</App>
        </ConfigProvider>
      </StyleProvider>
    </AntdRegistry>
  );
}
