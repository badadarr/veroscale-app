/**
 * Report generation utilities
 *
 * This file contains functions for generating reports in different formats.
 */

import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF interface to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

// Function to format date and time in a readable format
function formatDateTime(dateTimeStr: string): string {
  try {
    const date = new Date(dateTimeStr);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (e) {
    return dateTimeStr; // Return original if parsing fails
  }
}

// Function to format date only in a readable format
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Return original if date is invalid
    }
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return dateStr; // Return original if parsing fails
  }
}

// Function to format month and year
function formatMonthYear(monthStr: string): string {
  try {
    // If month is in YYYY-MM format, convert to month name and year
    if (/^\d{4}-\d{2}$/.test(monthStr)) {
      const [year, month] = monthStr.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
    }
    return monthStr;
  } catch (e) {
    return monthStr; // Return original if parsing fails
  }
}

// Function to generate a PDF report
export async function generatePDFReport(reportData: any): Promise<Buffer> {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text(reportData.title || "Report", 20, 20);

  // Add date
  doc.setFontSize(12);
  doc.text(
    `Generated on: ${new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}`,
    20,
    35
  );

  // Add report period information
  let yPosition = 45;
  if (reportData.date) {
    doc.setFontSize(12);
    doc.text(`Report Date: ${formatDate(reportData.date)}`, 20, yPosition);
    yPosition += 10;
  } else if (reportData.dateRange) {
    doc.setFontSize(12);
    // Ensure both dates are valid before formatting
    const fromDate = reportData.dateRange.from
      ? formatDate(reportData.dateRange.from)
      : "N/A";
    const toDate = reportData.dateRange.to
      ? formatDate(reportData.dateRange.to)
      : "N/A";
    doc.text(`Report Period: ${fromDate} to ${toDate}`, 20, yPosition);
    yPosition += 10;
  } else if (reportData.month) {
    doc.setFontSize(12);
    doc.text(
      `Report Month: ${formatMonthYear(reportData.month)}`,
      20,
      yPosition
    );
    yPosition += 10;
  }

  // Add summary information
  if (reportData.summary) {
    doc.setFontSize(14);
    doc.text("Summary:", 20, yPosition);
    doc.setFontSize(10);

    yPosition += 10;
    Object.entries(reportData.summary).forEach(([key, value]) => {
      // Format the key for better readability
      const formattedKey = key
        .replace(/([A-Z])/g, " $1") // Add space before capital letters
        .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
        .replace(/([a-z])([A-Z])/g, "$1 $2"); // Add space between words

      doc.text(`${formattedKey}: ${value}`, 20, yPosition);
      yPosition += 10;
    });
  }

  // Add table with records
  if (reportData.records && reportData.records.length > 0) {
    // Format timestamps in records before generating table
    const formattedRecords = reportData.records.map((record: any) => {
      const formattedRecord = { ...record };
      if (formattedRecord.timestamp) {
        formattedRecord.timestamp = formatDateTime(formattedRecord.timestamp);
      }
      return formattedRecord;
    });

    const headers = Object.keys(formattedRecords[0]);
    const tableData = formattedRecords.map((record: any) =>
      headers.map((header) => record[header] || "")
    );

    // Format header names for better readability
    const formattedHeaders = headers.map((header) => {
      if (header === "timestamp") return "Date & Time";
      if (header === "record_id") return "ID";
      if (header === "total_weight") return "Weight (kg)";
      if (header === "user_name") return "User";
      if (header === "item_name") return "Item";

      // Format camelCase or snake_case headers
      return header
        .replace(/_/g, " ") // Replace underscores with spaces
        .replace(/([A-Z])/g, " $1") // Add space before capital letters
        .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
        .trim();
    });

    doc.autoTable({
      startY: yPosition + 10,
      head: [formattedHeaders],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
  }

  // Add user activity table for weekly reports
  if (reportData.userActivity && reportData.userActivity.length > 0) {
    const yPos = doc.lastAutoTable
      ? doc.lastAutoTable.finalY + 20
      : yPosition + 10;

    doc.setFontSize(14);
    doc.text("User Activity", 20, yPos);

    const userHeaders = [
      "User",
      "Records",
      "Total Weight",
      "Status Distribution",
    ];
    const userData = reportData.userActivity.map((user: any) => [
      user.userName,
      user.recordCount,
      `${user.totalWeight.toFixed(2)} kg`,
      Object.entries(user.statuses)
        .map(([status, count]: [string, any]) => `${status}: ${count}`)
        .join(", "),
    ]);

    doc.autoTable({
      startY: yPos + 10,
      head: [userHeaders],
      body: userData,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
  }

  // Add item statistics table for monthly reports
  if (reportData.itemStats && reportData.itemStats.length > 0) {
    const yPos = doc.lastAutoTable
      ? doc.lastAutoTable.finalY + 20
      : yPosition + 10;

    doc.setFontSize(14);
    doc.text("Item Statistics", 20, yPos);

    const itemHeaders = ["Item", "Records", "Total Weight", "Average Weight"];
    const itemData = reportData.itemStats.map((item: any) => [
      item.itemName,
      item.recordCount,
      `${item.totalWeight.toFixed(2)} kg`,
      `${item.avgWeight.toFixed(2)} kg`,
    ]);

    doc.autoTable({
      startY: yPos + 10,
      head: [itemHeaders],
      body: itemData,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
  }

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

// Function to generate an Excel report
export async function generateExcelReport(reportData: any) {
  // Create a copy of the report data to avoid modifying the original
  const formattedReportData = JSON.parse(JSON.stringify(reportData));

  // Format timestamps in records
  if (
    formattedReportData.records &&
    Array.isArray(formattedReportData.records)
  ) {
    formattedReportData.records = formattedReportData.records.map(
      (record: any) => {
        const formattedRecord = { ...record };
        if (formattedRecord.timestamp) {
          formattedRecord.timestamp = formatDateTime(formattedRecord.timestamp);
        }
        return formattedRecord;
      }
    );
  }

  // Format date ranges for weekly reports
  if (formattedReportData.dateRange) {
    if (formattedReportData.dateRange.from) {
      formattedReportData.dateRange.from = formatDate(
        formattedReportData.dateRange.from
      );
    }
    if (formattedReportData.dateRange.to) {
      formattedReportData.dateRange.to = formatDate(
        formattedReportData.dateRange.to
      );
    }
  }

  // Format date for daily reports
  if (formattedReportData.date) {
    formattedReportData.date = formatDate(formattedReportData.date);
  }

  // Format month for monthly reports
  if (formattedReportData.month) {
    formattedReportData.month = formatMonthYear(formattedReportData.month);
  }

  // Add metadata to the report data
  formattedReportData.generatedAt = new Date().toLocaleString("id-ID");

  // In a real implementation, you would use xlsx or similar library
  // For example:
  // import * as XLSX from 'xlsx';

  // // Create a workbook with multiple sheets
  // const workbook = XLSX.utils.book_new();
  //
  // // Add metadata sheet
  // const metadataWs = XLSX.utils.aoa_to_sheet([
  //   ['Report Title', formattedReportData.title],
  //   ['Generated At', formattedReportData.generatedAt],
  //   formattedReportData.date ? ['Report Date', formattedReportData.date] : [],
  //   formattedReportData.dateRange ? ['Report Period', `${formattedReportData.dateRange.from} to ${formattedReportData.dateRange.to}`] : [],
  //   formattedReportData.month ? ['Report Month', formattedReportData.month] : []
  // ]);
  // XLSX.utils.book_append_sheet(workbook, metadataWs, 'Report Info');
  //
  // // Add records sheet
  // if (formattedReportData.records && formattedReportData.records.length > 0) {
  //   const recordsWs = XLSX.utils.json_to_sheet(formattedReportData.records);
  //   XLSX.utils.book_append_sheet(workbook, recordsWs, 'Records');
  // }
  //
  // // Add user activity sheet if available
  // if (formattedReportData.userActivity && formattedReportData.userActivity.length > 0) {
  //   const userActivityWs = XLSX.utils.json_to_sheet(formattedReportData.userActivity);
  //   XLSX.utils.book_append_sheet(workbook, userActivityWs, 'User Activity');
  // }
  //
  // // Add item statistics sheet if available
  // if (formattedReportData.itemStats && formattedReportData.itemStats.length > 0) {
  //   const itemStatsWs = XLSX.utils.json_to_sheet(formattedReportData.itemStats);
  //   XLSX.utils.book_append_sheet(workbook, itemStatsWs, 'Item Statistics');
  // }
  //
  // return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  // For now, we'll just return the formatted report data
  return formattedReportData;
}

// Function to generate a CSV report
export function generateCSVReport(reportData: any) {
  if (
    !reportData ||
    !reportData.records ||
    !Array.isArray(reportData.records)
  ) {
    return "No data available";
  }

  // Format timestamps in records before generating CSV
  const formattedRecords = reportData.records.map((record: any) => {
    const formattedRecord = { ...record };
    if (formattedRecord.timestamp) {
      formattedRecord.timestamp = formatDateTime(formattedRecord.timestamp);
    }
    return formattedRecord;
  });

  // Get headers from first record
  const headers = Object.keys(formattedRecords[0]);

  // Format header names for better readability
  const formattedHeaders = headers.map((header) => {
    if (header === "timestamp") return "Date & Time";
    if (header === "record_id") return "ID";
    if (header === "total_weight") return "Weight (kg)";
    if (header === "user_name") return "User";
    if (header === "item_name") return "Item";

    // Format camelCase or snake_case headers
    return header
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  });

  const csvHeader = formattedHeaders.join(",");

  // Generate rows
  const csvRows = formattedRecords.map((record: any) => {
    return headers
      .map((header) => {
        const value = record[header];
        // Handle values that might contain commas
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value;
      })
      .join(",");
  });

  // Add report metadata as comments
  let csvContent = `# ${reportData.title}\n`;
  csvContent += `# Generated on: ${new Date().toLocaleString("id-ID")}\n`;

  if (reportData.date) {
    csvContent += `# Report Date: ${formatDate(reportData.date)}\n`;
  } else if (reportData.dateRange) {
    csvContent += `# Report Period: ${formatDate(
      reportData.dateRange.from
    )} to ${formatDate(reportData.dateRange.to)}\n`;
  } else if (reportData.month) {
    csvContent += `# Report Month: ${formatMonthYear(reportData.month)}\n`;
  }

  if (reportData.summary) {
    csvContent += `# Summary:\n`;
    Object.entries(reportData.summary).forEach(([key, value]) => {
      const formattedKey = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .replace(/([a-z])([A-Z])/g, "$1 $2");

      csvContent += `# ${formattedKey}: ${value}\n`;
    });
  }

  csvContent += `\n${csvHeader}\n${csvRows.join("\n")}`;

  // Add user activity data if available
  if (reportData.userActivity && reportData.userActivity.length > 0) {
    csvContent += `\n\n# User Activity\n`;
    csvContent += `User,Records,Total Weight,Status Distribution\n`;

    reportData.userActivity.forEach((user: any) => {
      const statusStr = Object.entries(user.statuses)
        .map(([status, count]: [string, any]) => `${status}: ${count}`)
        .join("; ");

      csvContent += `"${user.userName}",${
        user.recordCount
      },${user.totalWeight.toFixed(2)} kg,"${statusStr}"\n`;
    });
  }

  // Add item statistics if available
  if (reportData.itemStats && reportData.itemStats.length > 0) {
    csvContent += `\n\n# Item Statistics\n`;
    csvContent += `Item,Records,Total Weight,Average Weight\n`;

    reportData.itemStats.forEach((item: any) => {
      csvContent += `"${item.itemName}",${
        item.recordCount
      },${item.totalWeight.toFixed(2)} kg,${item.avgWeight.toFixed(2)} kg\n`;
    });
  }

  return csvContent;
}

// Function to format report data for display
export function formatReportData(reportData: any) {
  // Format dates, numbers, etc.
  if (reportData.records) {
    reportData.records = reportData.records.map((record: any) => {
      // Format dates
      if (record.timestamp) {
        record.timestamp = new Date(record.timestamp).toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }

      // Format weights
      if (record.total_weight) {
        record.total_weight = `${record.total_weight.toFixed(2)} kg`;
      }

      return record;
    });
  }

  // Format dates in user activity if present
  if (reportData.userActivity) {
    reportData.userActivity.forEach((user: any) => {
      if (user.lastActive) {
        user.lastActive = new Date(user.lastActive).toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }
    });
  }

  return reportData;
}
