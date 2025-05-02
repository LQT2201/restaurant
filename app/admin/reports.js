import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Card,
  Text,
  Button,
  DataTable,
  ActivityIndicator,
  SegmentedButtons,
  Surface,
} from "react-native-paper";
import { getSalesReport } from "../../database/orderOperations";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatTime,
} from "../../utils/format";

export default function ReportsScreen() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("day");
  const [reportPeriod, setReportPeriod] = useState("week"); // week, month, year
  const [reportData, setReportData] = useState(null);

  // Load report data when report type or period changes
  useEffect(() => {
    loadReportData();
  }, [reportType, reportPeriod]);

  // Load report data from database
  const loadReportData = async () => {
    try {
      setLoading(true);

      // Calculate date range based on report period
      const endDate = new Date();
      const startDate = new Date();

      switch (reportPeriod) {
        case "week":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const data = await getSalesReport(
        startDate.toISOString(),
        endDate.toISOString(),
        reportType
      );

      setReportData(data);
    } catch (error) {
      console.error("Failed to load report data:", error);
      Alert.alert("Error", "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  // Get the label for the date column based on report type
  const getDateColumnLabel = () => {
    switch (reportType) {
      case "day":
        return "Date";
      case "week":
        return "Week";
      case "month":
        return "Month";
      default:
        return "Date";
    }
  };

  // Format the date value based on report type
  const formatDateValue = (item) => {
    if (!item.date_group) return "";

    switch (reportType) {
      case "day":
        return formatDate(item.date_group);
      case "week": {
        const [year, week] = item.date_group.split("-");
        return `Week ${week} of ${year}`;
      }
      case "month": {
        const [year, month] = item.date_group.split("-");
        return `${new Date(year, parseInt(month) - 1).toLocaleString(
          "default",
          {
            month: "long",
          }
        )} ${year}`;
      }
      default:
        return item.date_group;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Sales Report" />
        <Card.Content>
          <Text style={styles.sectionTitle}>Report Period</Text>
          <SegmentedButtons
            value={reportPeriod}
            onValueChange={setReportPeriod}
            buttons={[
              { value: "week", label: "Last Week" },
              { value: "month", label: "Last Month" },
              { value: "year", label: "Last Year" },
            ]}
            style={styles.segmentedButtons}
          />

          <Text style={styles.sectionTitle}>Group By</Text>
          <SegmentedButtons
            value={reportType}
            onValueChange={setReportType}
            buttons={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
            style={styles.segmentedButtons}
          />

          <Button
            mode="contained"
            onPress={loadReportData}
            style={styles.loadButton}
            loading={loading}
            disabled={loading}
          >
            Refresh Report
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Summary" />
        <Card.Content>
          <View style={styles.summaryContainer}>
            <Surface style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Sales</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(reportData?.summary?.total_revenue)}
              </Text>
            </Surface>
            <Surface style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Orders</Text>
              <Text style={styles.summaryValue}>
                {formatNumber(reportData?.summary?.total_orders)}
              </Text>
            </Surface>
            <Surface style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Avg. Order</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(reportData?.summary?.average_order_value)}
              </Text>
            </Surface>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Detailed Report" />
        <Card.Content>
          {loading ? (
            <ActivityIndicator style={styles.loading} />
          ) : reportData?.salesByDate?.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>{getDateColumnLabel()}</DataTable.Title>
                <DataTable.Title numeric>Orders</DataTable.Title>
                <DataTable.Title numeric>Sales</DataTable.Title>
              </DataTable.Header>

              {reportData.salesByDate.map((item, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell>{formatDateValue(item)}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    {formatNumber(item.order_count)}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {formatCurrency(item.total_sales)}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <Text style={styles.noDataText}>
              No data available for the selected period
            </Text>
          )}
        </Card.Content>
      </Card>

      {reportData?.salesByCategory?.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Sales by Category" />
          <Card.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Category</DataTable.Title>
                <DataTable.Title numeric>Items Sold</DataTable.Title>
                <DataTable.Title numeric>Total Sales</DataTable.Title>
              </DataTable.Header>

              {reportData.salesByCategory.map((item, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell>{item.category_name}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    {formatNumber(item.items_sold)}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {formatCurrency(item.total_sales)}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      )}

      {reportData?.topSellingItems?.length > 0 && (
        <Card style={[styles.card, styles.lastCard]}>
          <Card.Title title="Top Selling Items" />
          <Card.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Item</DataTable.Title>
                <DataTable.Title>Category</DataTable.Title>
                <DataTable.Title numeric>Quantity</DataTable.Title>
                <DataTable.Title numeric>Sales</DataTable.Title>
              </DataTable.Header>

              {reportData.topSellingItems.map((item, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell>{item.item_name}</DataTable.Cell>
                  <DataTable.Cell>{item.category_name}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    {formatNumber(item.quantity_sold)}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {formatCurrency(item.total_sales)}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  lastCard: {
    marginBottom: 32,
  },
  segmentedButtons: {
    marginVertical: 10,
  },
  loadButton: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  summaryItem: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loading: {
    marginVertical: 20,
  },
  noDataText: {
    textAlign: "center",
    marginVertical: 20,
    fontStyle: "italic",
    color: "#666",
  },
});
