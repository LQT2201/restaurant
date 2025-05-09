import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import {
  Card,
  Text,
  Button,
  DataTable,
  ActivityIndicator,
  SegmentedButtons,
  Surface,
  useTheme,
  IconButton,
  Divider,
  Chip,
  Avatar,
  ProgressBar,
} from "react-native-paper";
import { getSalesReport } from "../../database/orderOperations";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatTime,
} from "../../utils/format";
import * as Haptics from "expo-haptics";

export default function ReportsScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("day");
  const [reportPeriod, setReportPeriod] = useState("week"); // week, month, year
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, details, categories, topItems

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const summaryAnimations = useRef({
    revenue: new Animated.Value(0),
    orders: new Animated.Value(0),
    average: new Animated.Value(0),
  }).current;
  const tableAnim = useRef(new Animated.Value(0)).current;
  const tabBarAnim = useRef(new Animated.Value(0)).current;

  // Animated values for category percentages
  const categoryAnimations = useRef({}).current;

  // Screen dimensions for responsive design
  const { width } = Dimensions.get("window");

  // Initialize animations when component mounts
  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(tabBarAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load report data when report type or period changes
  useEffect(() => {
    loadReportData();
  }, [reportType, reportPeriod]);

  // Animate summary cards when data changes
  useEffect(() => {
    if (reportData?.summary) {
      // Reset animations
      Object.keys(summaryAnimations).forEach((key) => {
        summaryAnimations[key].setValue(0);
      });

      // Start animations in sequence
      Animated.stagger(150, [
        Animated.timing(summaryAnimations.revenue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(summaryAnimations.orders, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(summaryAnimations.average, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate table
      Animated.timing(tableAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }).start();

      // Animate category bars if available
      if (reportData?.salesByCategory) {
        // Calculate total for percentages
        const totalSales = reportData.salesByCategory.reduce(
          (sum, item) => sum + item.total_sales,
          0
        );

        // Initialize and animate each category
        reportData.salesByCategory.forEach((item, index) => {
          if (!categoryAnimations[item.category_name]) {
            categoryAnimations[item.category_name] = new Animated.Value(0);
          }

          Animated.timing(categoryAnimations[item.category_name], {
            toValue: item.total_sales / totalSales,
            duration: 1000,
            delay: index * 100,
            useNativeDriver: false,
          }).start();
        });
      }
    }
  }, [reportData]);

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
      Alert.alert("Lỗi", "Không thể tải dữ liệu báo cáo");
    } finally {
      setLoading(false);
    }
  };

  // Get the label for the date column based on report type
  const getDateColumnLabel = () => {
    switch (reportType) {
      case "day":
        return "Ngày";
      case "week":
        return "Tuần";
      case "month":
        return "Tháng";
      default:
        return "Ngày";
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
        return `Tuần ${week} của năm ${year}`;
      }
      case "month": {
        const [year, month] = item.date_group.split("-");
        return `${new Date(year, parseInt(month) - 1).toLocaleString("vi-VN", {
          month: "long",
        })} ${year}`;
      }
      default:
        return item.date_group;
    }
  };

  // Get color for category
  const getCategoryColor = (index) => {
    const colors = [
      "#6200ee",
      "#03DAC6",
      "#FF9800",
      "#4CAF50",
      "#F44336",
      "#2196F3",
      "#9C27B0",
      "#E91E63",
    ];
    return colors[index % colors.length];
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    Haptics.selectionAsync();

    // Animate tab change
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveTab(tab);

      // Animate new content in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Render tab bar
  const renderTabBar = () => (
    <Animated.View
      style={[
        styles.tabBar,
        {
          opacity: tabBarAnim,
          transform: [
            {
              translateY: tabBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "overview" && styles.activeTab]}
          onPress={() => handleTabChange("overview")}
        >
          <IconButton
            icon="chart-box"
            size={20}
            iconColor={activeTab === "overview" ? "#fff" : "#6200ee"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "overview" && styles.activeTabText,
            ]}
          >
            Tổng Quan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "details" && styles.activeTab]}
          onPress={() => handleTabChange("details")}
        >
          <IconButton
            icon="table"
            size={20}
            iconColor={activeTab === "details" ? "#fff" : "#6200ee"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "details" && styles.activeTabText,
            ]}
          >
            Chi Tiết
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "categories" && styles.activeTab]}
          onPress={() => handleTabChange("categories")}
        >
          <IconButton
            icon="shape"
            size={20}
            iconColor={activeTab === "categories" ? "#fff" : "#6200ee"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "categories" && styles.activeTabText,
            ]}
          >
            Danh Mục
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "topItems" && styles.activeTab]}
          onPress={() => handleTabChange("topItems")}
        >
          <IconButton
            icon="star"
            size={20}
            iconColor={activeTab === "topItems" ? "#fff" : "#6200ee"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "topItems" && styles.activeTabText,
            ]}
          >
            Món Bán Chạy
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );

  // Render filters
  const renderFilters = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.filterHeader}>
          <Text style={styles.sectionTitle}>Báo Cáo Doanh Thu</Text>
          <Button
            mode="contained"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              loadReportData();
            }}
            style={styles.loadButton}
            loading={loading}
            disabled={loading}
            icon="refresh"
            contentStyle={styles.refreshButtonContent}
          >
            Làm Mới
          </Button>
        </View>

        <Divider style={styles.divider} />

        {/* <Text style={styles.filterLabel}>Khoảng Thời Gian</Text>
        <View style={styles.chipContainer}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setReportPeriod("week");
            }}
          >
            <Chip
              selected={reportPeriod === "week"}
              style={[
                styles.filterChip,
                reportPeriod === "week" && styles.selectedChip,
              ]}
              textStyle={reportPeriod === "week" ? styles.selectedChipText : {}}
              icon="calendar-week"
            >
              Tuần Trước
            </Chip>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setReportPeriod("month");
            }}
          >
            <Chip
              selected={reportPeriod === "month"}
              style={[
                styles.filterChip,
                reportPeriod === "month" && styles.selectedChip,
              ]}
              textStyle={
                reportPeriod === "month" ? styles.selectedChipText : {}
              }
              icon="calendar-month"
            >
              Tháng Trước
            </Chip>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setReportPeriod("year");
            }}
          >
            <Chip
              selected={reportPeriod === "year"}
              style={[
                styles.filterChip,
                reportPeriod === "year" && styles.selectedChip,
              ]}
              textStyle={reportPeriod === "year" ? styles.selectedChipText : {}}
              icon="calendar"
            >
              Năm Trước
            </Chip>
          </TouchableOpacity>
        </View> */}

        <Text style={styles.filterLabel}>Nhóm Theo</Text>
        <View style={styles.chipContainer}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setReportType("day");
            }}
          >
            <Chip
              selected={reportType === "day"}
              style={[
                styles.filterChip,
                reportType === "day" && styles.selectedChip,
              ]}
              textStyle={reportType === "day" ? styles.selectedChipText : {}}
              icon="calendar-today"
            >
              Ngày
            </Chip>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setReportType("week");
            }}
          >
            <Chip
              selected={reportType === "week"}
              style={[
                styles.filterChip,
                reportType === "week" && styles.selectedChip,
              ]}
              textStyle={reportType === "week" ? styles.selectedChipText : {}}
              icon="calendar-week"
            >
              Tuần
            </Chip>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setReportType("month");
            }}
          >
            <Chip
              selected={reportType === "month"}
              style={[
                styles.filterChip,
                reportType === "month" && styles.selectedChip,
              ]}
              textStyle={reportType === "month" ? styles.selectedChipText : {}}
              icon="calendar-month"
            >
              Tháng
            </Chip>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  // Render summary cards
  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <Animated.View
        style={[
          styles.summaryCard,
          {
            opacity: summaryAnimations.revenue,
            transform: [
              {
                translateY: summaryAnimations.revenue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
              {
                scale: summaryAnimations.revenue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Surface style={[styles.summaryItem, { borderLeftColor: "#6200ee" }]}>
          <View style={styles.summaryIconContainer}>
            <Avatar.Icon
              size={40}
              icon="cash-multiple"
              style={styles.summaryIcon}
              color="#6200ee"
            />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Tổng Doanh Thu</Text>
            <Text style={[styles.summaryValue, { color: "#6200ee" }]}>
              {formatCurrency(reportData?.summary?.total_revenue)}
            </Text>
          </View>
        </Surface>
      </Animated.View>

      <Animated.View
        style={[
          styles.summaryCard,
          {
            opacity: summaryAnimations.orders,
            transform: [
              {
                translateY: summaryAnimations.orders.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
              {
                scale: summaryAnimations.orders.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Surface style={[styles.summaryItem, { borderLeftColor: "#4CAF50" }]}>
          <View style={styles.summaryIconContainer}>
            <Avatar.Icon
              size={40}
              icon="receipt"
              style={[
                styles.summaryIcon,
                { backgroundColor: "rgba(76, 175, 80, 0.1)" },
              ]}
              color="#4CAF50"
            />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Tổng Đơn Hàng</Text>
            <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>
              {formatNumber(reportData?.summary?.total_orders)}
            </Text>
          </View>
        </Surface>
      </Animated.View>

      <Animated.View
        style={[
          styles.summaryCard,
          {
            opacity: summaryAnimations.average,
            transform: [
              {
                translateY: summaryAnimations.average.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
              {
                scale: summaryAnimations.average.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Surface style={[styles.summaryItem, { borderLeftColor: "#FF9800" }]}>
          <View style={styles.summaryIconContainer}>
            <Avatar.Icon
              size={40}
              icon="chart-line"
              style={[
                styles.summaryIcon,
                { backgroundColor: "rgba(255, 152, 0, 0.1)" },
              ]}
              color="#FF9800"
            />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Trung Bình/Đơn</Text>
            <Text style={[styles.summaryValue, { color: "#FF9800" }]}>
              {formatCurrency(reportData?.summary?.average_order_value)}
            </Text>
          </View>
        </Surface>
      </Animated.View>
    </View>
  );

  // Render overview tab content
  const renderOverviewTab = () => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {renderSummary()}

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Doanh Thu Theo Thời Gian</Text>
          <Divider style={styles.divider} />

          {loading ? (
            <ActivityIndicator style={styles.loading} color="#6200ee" />
          ) : reportData?.salesByDate?.length > 0 ? (
            <Animated.View
              style={{
                opacity: tableAnim,
                transform: [
                  {
                    translateY: tableAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              <DataTable style={styles.dataTable}>
                <DataTable.Header style={styles.tableHeader}>
                  <DataTable.Title style={styles.dateColumn}>
                    {getDateColumnLabel()}
                  </DataTable.Title>
                  <DataTable.Title numeric style={styles.numberColumn}>
                    Đơn Hàng
                  </DataTable.Title>
                  <DataTable.Title numeric style={styles.numberColumn}>
                    Doanh Thu
                  </DataTable.Title>
                </DataTable.Header>

                {reportData.salesByDate.slice(0, 5).map((item, index) => (
                  <DataTable.Row key={index} style={styles.tableRow}>
                    <DataTable.Cell style={styles.dateColumn}>
                      {formatDateValue(item)}
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.numberColumn}>
                      {formatNumber(item.order_count)}
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.numberColumn}>
                      {formatCurrency(item.total_sales)}
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>

              {reportData.salesByDate.length > 5 && (
                <Button
                  mode="text"
                  onPress={() => handleTabChange("details")}
                  style={styles.viewMoreButton}
                  icon="chevron-right"
                  contentStyle={{ flexDirection: "row-reverse" }}
                >
                  Xem thêm
                </Button>
              )}
            </Animated.View>
          ) : (
            <Text style={styles.noDataText}>
              Không có dữ liệu cho khoảng thời gian đã chọn
            </Text>
          )}
        </Card.Content>
      </Card>

      {reportData?.topSellingItems?.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Top 3 Món Bán Chạy</Text>
            <Divider style={styles.divider} />

            <Animated.View
              style={{
                opacity: tableAnim,
                transform: [
                  {
                    translateY: tableAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              {reportData.topSellingItems.slice(0, 3).map((item, index) => (
                <Surface key={index} style={styles.topItemCard}>
                  <View style={styles.topItemRank}>
                    <Text style={styles.topItemRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.topItemContent}>
                    <Text style={styles.topItemName}>{item.item_name}</Text>
                    <View style={styles.topItemDetails}>
                      <Chip
                        style={styles.categoryChip}
                        textStyle={styles.categoryChipText}
                      >
                        {item.category_name}
                      </Chip>
                      <Text style={styles.topItemStat}>
                        {formatNumber(item.quantity_sold)} đã bán
                      </Text>
                      <Text style={styles.topItemRevenue}>
                        {formatCurrency(item.total_sales)}
                      </Text>
                    </View>
                  </View>
                </Surface>
              ))}

              {reportData.topSellingItems.length > 3 && (
                <Button
                  mode="text"
                  onPress={() => handleTabChange("topItems")}
                  style={styles.viewMoreButton}
                  icon="chevron-right"
                  contentStyle={{ flexDirection: "row-reverse" }}
                >
                  Xem thêm
                </Button>
              )}
            </Animated.View>
          </Card.Content>
        </Card>
      )}
    </Animated.View>
  );

  // Render details tab content
  const renderDetailsTab = () => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Báo Cáo Chi Tiết</Text>
          <Divider style={styles.divider} />

          {loading ? (
            <ActivityIndicator style={styles.loading} color="#6200ee" />
          ) : reportData?.salesByDate?.length > 0 ? (
            <DataTable style={styles.dataTable}>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={styles.dateColumn}>
                  {getDateColumnLabel()}
                </DataTable.Title>
                <DataTable.Title numeric style={styles.numberColumn}>
                  Đơn Hàng
                </DataTable.Title>
                <DataTable.Title numeric style={styles.numberColumn}>
                  Doanh Thu
                </DataTable.Title>
              </DataTable.Header>

              {reportData.salesByDate.map((item, index) => (
                <DataTable.Row key={index} style={styles.tableRow}>
                  <DataTable.Cell style={styles.dateColumn}>
                    {formatDateValue(item)}
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.numberColumn}>
                    {formatNumber(item.order_count)}
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.numberColumn}>
                    {formatCurrency(item.total_sales)}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <Text style={styles.noDataText}>
              Không có dữ liệu cho khoảng thời gian đã chọn
            </Text>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );

  // Render categories tab content
  const renderCategoriesTab = () => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {reportData?.salesByCategory?.length > 0 ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Doanh Thu Theo Danh Mục</Text>
            <Divider style={styles.divider} />

            {reportData.salesByCategory.map((item, index) => {
              // Get or create animation value for this category
              if (!categoryAnimations[item.category_name]) {
                categoryAnimations[item.category_name] = new Animated.Value(0);
              }

              const color = getCategoryColor(index);

              return (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryNameContainer}>
                      <View
                        style={[
                          styles.categoryColorDot,
                          { backgroundColor: color },
                        ]}
                      />
                      <Text style={styles.categoryName}>
                        {item.category_name}
                      </Text>
                    </View>
                    <Text style={styles.categoryValue}>
                      {formatCurrency(item.total_sales)}
                    </Text>
                  </View>

                  <View style={styles.progressBarContainer}>
                    <Animated.View
                      style={[
                        styles.progressBar,
                        {
                          width: categoryAnimations[
                            item.category_name
                          ].interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryDetailText}>
                      {formatNumber(item.items_sold)} món đã bán
                    </Text>
                    <Text style={styles.categoryDetailText}>
                      {Math.round(
                        categoryAnimations[item.category_name].__getValue() *
                          100
                      )}
                      %
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Doanh Thu Theo Danh Mục</Text>
            <Divider style={styles.divider} />
            <Text style={styles.noDataText}>
              Không có dữ liệu danh mục cho khoảng thời gian đã chọn
            </Text>
          </Card.Content>
        </Card>
      )}
    </Animated.View>
  );

  // Render top items tab content
  const renderTopItemsTab = () => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {reportData?.topSellingItems?.length > 0 ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Món Bán Chạy Nhất</Text>
            <Divider style={styles.divider} />

            <DataTable style={styles.dataTable}>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={{ flex: 2 }}>Món</DataTable.Title>
                <DataTable.Title style={{ flex: 1 }}>Danh Mục</DataTable.Title>
                <DataTable.Title numeric style={{ flex: 1 }}>
                  Số Lượng
                </DataTable.Title>
                <DataTable.Title numeric style={{ flex: 1 }}>
                  Doanh Thu
                </DataTable.Title>
              </DataTable.Header>

              {reportData.topSellingItems.map((item, index) => (
                <DataTable.Row key={index} style={styles.tableRow}>
                  <DataTable.Cell style={{ flex: 2 }}>
                    {item.item_name}
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1 }}>
                    {item.category_name}
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 1 }}>
                    {formatNumber(item.quantity_sold)}
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 1 }}>
                    {formatCurrency(item.total_sales)}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Món Bán Chạy Nhất</Text>
            <Divider style={styles.divider} />
            <Text style={styles.noDataText}>
              Không có dữ liệu món ăn cho khoảng thời gian đã chọn
            </Text>
          </Card.Content>
        </Card>
      )}
    </Animated.View>
  );

  // Render active tab content
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "details":
        return renderDetailsTab();
      case "categories":
        return renderCategoriesTab();
      case "topItems":
        return renderTopItemsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderFilters()}
        {renderTabBar()}
        {renderActiveTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  divider: {
    marginVertical: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 8,
    color: "#424242",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
  },
  selectedChip: {
    backgroundColor: "rgba(98, 0, 238, 0.1)",
  },
  selectedChipText: {
    color: "#6200ee",
  },
  loadButton: {
    borderRadius: 8,
  },
  refreshButtonContent: {
    height: 36,
  },

  // Tab bar styles
  tabBar: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: "#6200ee",
  },
  tabIcon: {
    margin: 0,
    padding: 0,
    width: 24,
    height: 24,
  },
  tabText: {
    color: "#6200ee",
    fontWeight: "500",
    marginLeft: -4,
  },
  activeTabText: {
    color: "#fff",
  },

  // Summary styles
  summaryContainer: {
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 12,
  },
  summaryItem: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    elevation: 2,
  },
  summaryIconContainer: {
    marginRight: 16,
  },
  summaryIcon: {
    backgroundColor: "rgba(98, 0, 238, 0.1)",
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
  },

  // Card styles
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },

  // Table styles
  dataTable: {
    marginTop: 8,
  },
  tableHeader: {
    backgroundColor: "#f9f5ff",
    borderRadius: 8,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dateColumn: {
    flex: 2,
  },
  numberColumn: {
    flex: 1,
  },

  // Category styles
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6200ee",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  categoryDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  categoryDetailText: {
    fontSize: 12,
    color: "#757575",
  },

  // Top items styles
  topItemCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6200ee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  topItemRankText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  topItemContent: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  topItemDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  categoryChip: {
    height: 30,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 12,
  },
  topItemStat: {
    fontSize: 12,
    color: "#757575",
    marginRight: 8,
  },
  topItemRevenue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6200ee",
  },

  // Other styles
  viewMoreButton: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  loading: {
    marginVertical: 20,
  },
  noDataText: {
    textAlign: "center",
    marginVertical: 20,
    fontStyle: "italic",
    color: "#757575",
  },
});
