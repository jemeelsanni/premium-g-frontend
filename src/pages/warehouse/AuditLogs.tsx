import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Grid,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { auditLogService, InventoryChangeLog, SuspiciousActivity } from '../../services/auditLogService';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AuditLogs: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [inventoryChanges, setInventoryChanges] = useState<InventoryChangeLog[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [suspiciousSummary, setSuspiciousSummary] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    triggeredBy: '',
    startDate: '',
    endDate: '',
    days: 7,
  });

  useEffect(() => {
    if (tabValue === 0) {
      loadInventoryChanges();
    } else if (tabValue === 1) {
      loadSuspiciousActivities();
    }
  }, [tabValue, page, filters]);

  const loadInventoryChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditLogService.getInventoryChanges({
        triggeredBy: filters.triggeredBy || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page,
        limit: 20,
      });

      setInventoryChanges(response.data.logs || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load inventory changes');
    } finally {
      setLoading(false);
    }
  };

  const loadSuspiciousActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditLogService.getSuspiciousActivities(filters.days);

      setSuspiciousActivities(response.suspiciousActivities || []);
      setSuspiciousSummary(response.summary);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load suspicious activities');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (tabValue === 0) {
      loadInventoryChanges();
    } else {
      loadSuspiciousActivities();
    }
  };

  const getTriggerColor = (trigger: string) => {
    switch (trigger) {
      case 'MANUAL_ADJUSTMENT':
        return 'warning';
      case 'SALE':
        return 'success';
      case 'PURCHASE_UPDATE':
        return 'info';
      case 'PURCHASE_DELETE':
        return 'error';
      case 'SALE_DELETE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSeverityColor = (severity: 'HIGH' | 'MEDIUM') => {
    return severity === 'HIGH' ? 'error' : 'warning';
  };

  const formatChange = (change: { old: number; new: number; diff: number }) => {
    const color = change.diff < 0 ? 'error' : change.diff > 0 ? 'success' : 'default';
    return (
      <Chip
        label={`${change.old} → ${change.new} (${change.diff > 0 ? '+' : ''}${change.diff})`}
        color={color}
        size="small"
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Warehouse Audit Logs</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Inventory Changes" />
          <Tab
            label={
              <Badge badgeContent={suspiciousSummary?.high || 0} color="error">
                Suspicious Activities
              </Badge>
            }
          />
        </Tabs>

        {/* Tab 1: Inventory Changes */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Trigger Type"
                value={filters.triggeredBy}
                onChange={(e) => setFilters({ ...filters, triggeredBy: e.target.value })}
                size="small"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="MANUAL_ADJUSTMENT">Manual Adjustment</MenuItem>
                <MenuItem value="SALE">Sale</MenuItem>
                <MenuItem value="PURCHASE_UPDATE">Purchase Update</MenuItem>
                <MenuItem value="PURCHASE_DELETE">Purchase Delete</MenuItem>
                <MenuItem value="SALE_DELETE">Sale Delete</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FilterIcon />}
                onClick={() => setPage(1)}
                sx={{ height: '40px' }}
              >
                Apply Filters
              </Button>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : inventoryChanges.length === 0 ? (
            <Alert severity="info">No inventory changes found</Alert>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date/Time</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Trigger</TableCell>
                      <TableCell>Changes</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryChanges.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {log.productName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {log.user?.username || 'SYSTEM'}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {log.user?.role}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.triggeredBy}
                            color={getTriggerColor(log.triggeredBy)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="caption">View Changes</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Box>
                                {log.changes?.packs && (
                                  <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption">Packs: </Typography>
                                    {formatChange(log.changes.packs)}
                                  </Box>
                                )}
                                {log.changes?.pallets && (
                                  <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption">Pallets: </Typography>
                                    {formatChange(log.changes.pallets)}
                                  </Box>
                                )}
                                {log.changes?.units && (
                                  <Box>
                                    <Typography variant="caption">Units: </Typography>
                                    {formatChange(log.changes.units)}
                                  </Box>
                                )}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300 }}>
                            {log.reason}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            </>
          )}
        </TabPanel>

        {/* Tab 2: Suspicious Activities */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Time Period"
                value={filters.days}
                onChange={(e) => setFilters({ ...filters, days: Number(e.target.value) })}
                size="small"
              >
                <MenuItem value={7}>Last 7 days</MenuItem>
                <MenuItem value={14}>Last 14 days</MenuItem>
                <MenuItem value={30}>Last 30 days</MenuItem>
                <MenuItem value={60}>Last 60 days</MenuItem>
                <MenuItem value={90}>Last 90 days</MenuItem>
              </TextField>
            </Grid>
            {suspiciousSummary && (
              <Grid item xs={12} md={9}>
                <Alert severity="info" icon={<InfoIcon />}>
                  <Typography variant="body2">
                    Found <strong>{suspiciousSummary.total}</strong> suspicious activities (
                    <strong style={{ color: '#f44336' }}>{suspiciousSummary.high} HIGH</strong>,{' '}
                    <strong style={{ color: '#ff9800' }}>{suspiciousSummary.medium} MEDIUM</strong>
                    ) in {suspiciousSummary.period}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : suspiciousActivities.length === 0 ? (
            <Alert severity="success">No suspicious activities detected! 🎉</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {suspiciousActivities.map((activity) => (
                <Card
                  key={activity.id}
                  sx={{
                    border: 2,
                    borderColor: activity.severity === 'HIGH' ? 'error.main' : 'warning.main',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">{activity.productName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </Box>
                      <Chip
                        label={activity.severity}
                        color={getSeverityColor(activity.severity)}
                        icon={<WarningIcon />}
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          User:
                        </Typography>
                        <Typography variant="body1">
                          {activity.user?.username || 'SYSTEM'} ({activity.user?.role})
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Trigger:
                        </Typography>
                        <Chip
                          label={activity.triggeredBy}
                          color={getTriggerColor(activity.triggeredBy)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Reason:
                        </Typography>
                        <Typography variant="body1">{activity.reason}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Red Flags:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {activity.suspicionReasons.map((reason, idx) => (
                            <Chip key={idx} label={reason} color="error" size="small" />
                          ))}
                        </Box>
                      </Grid>
                      {activity.changes && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Changes:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            {activity.changes.packs && formatChange(activity.changes.packs)}
                            {activity.changes.pallets && formatChange(activity.changes.pallets)}
                            {activity.changes.units && formatChange(activity.changes.units)}
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </TabPanel>
      </Card>
    </Box>
  );
};

export default AuditLogs;
