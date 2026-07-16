import { useMemo } from 'react'
import {
  CellStyleModule,
  ClientSideRowModelModule,
  ModuleRegistry,
  NumberFilterModule,
  PaginationModule,
  TextFilterModule,
  ValidationModule,
  themeBalham,
} from 'ag-grid-community'
import type { ColDef, ColGroupDef, ICellRendererParams } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { milestoneNames } from '../types'
import type { FieldDefinition, MilestoneName, Project } from '../types'
import { formatDate, formatMoney } from '../utils'
import { EditableCell } from './EditableCell'
import { Icon } from './Icon'

ModuleRegistry.registerModules([
  CellStyleModule,
  ClientSideRowModelModule,
  NumberFilterModule,
  PaginationModule,
  TextFilterModule,
])

if (import.meta.env.DEV) ModuleRegistry.registerModules([ValidationModule])

const gridTheme = themeBalham.withParams({
  accentColor: '#1d4ed8',
  backgroundColor: '#ffffff',
  borderColor: '#d8dee6',
  borderRadius: 0,
  foregroundColor: '#1f2937',
  headerBackgroundColor: '#f5f7fa',
  headerTextColor: '#4b5563',
  spacing: 4,
})

interface ProjectGridProps {
  projects: Project[]
  fields: FieldDefinition[]
  onSelect: (project: Project) => void
  onFieldChange: (key: string, field: string, value: string | number | boolean) => void
}

function ProjectIdentityCell({ data, onSelect }: ICellRendererParams<Project> & { onSelect: (project: Project) => void }) {
  if (!data) return null
  return <button type="button" className="grid-project-link" onClick={() => onSelect(data)}><span><strong>{data.name}</strong><small><code>{data.key}</code></small></span><Icon name="chevron" size={14} /></button>
}

function ManagerCell({ data }: ICellRendererParams<Project>) {
  if (!data) return null
  return <span className="grid-manager"><span className="avatar">{data.managerInitials}</span><span><strong>{data.manager}</strong><small>Manager</small></span></span>
}

function MilestoneCell({ data, milestoneName, onSelect }: ICellRendererParams<Project> & { milestoneName: MilestoneName; onSelect: (project: Project) => void }) {
  if (!data) return null
  const milestone = data.milestones.find((item) => item.name === milestoneName)
  if (!milestone) return null
  const label = milestone.status === 'done' ? 'Done' : milestone.status === 'in_progress' ? 'In progress' : milestone.status === 'blocked' ? 'Blocked' : 'Not started'
  return (
    <button type="button" className={`grid-milestone ${milestone.status}`} onClick={() => onSelect(data)} title={`${milestoneName}: ${label}`}>
      <span className="milestone-state-icon">{milestone.status === 'done' ? <Icon name="check" size={12} /> : milestone.status === 'blocked' ? <Icon name="warning" size={12} /> : milestone.status === 'in_progress' ? <i /> : <span>—</span>}</span>
      <span><strong>{label}</strong>{milestone.durationDays ? <small>{milestone.durationDays} days</small> : milestone.automatic ? <small>JIRA</small> : null}</span>
    </button>
  )
}

export function ProjectGrid({ projects, fields, onSelect, onFieldChange }: ProjectGridProps) {
  const columnDefs = useMemo<(ColDef<Project> | ColGroupDef<Project>)[]>(() => {
    const milestoneColumns: ColDef<Project>[] = milestoneNames.map((milestoneName) => ({
      colId: `milestone_${milestoneName.toLowerCase().replace(/\s+/g, '_')}`,
      headerName: milestoneName,
      width: milestoneName === 'Technical ARP' ? 148 : 126,
      minWidth: 118,
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
      cellRenderer: MilestoneCell,
      cellRendererParams: { milestoneName, onSelect },
      valueGetter: ({ data }) => data?.milestones.find((item) => item.name === milestoneName)?.status ?? 'not_started',
    }))

    const customColumns: ColDef<Project>[] = fields.filter((field) => field.active && field.visible).map((field) => ({
      colId: `custom_${field.id}`,
      headerName: field.label,
      width: 160,
      filter: true,
      valueGetter: ({ data }) => data?.custom[field.id] ?? '',
      cellRenderer: ({ data }: ICellRendererParams<Project>) => data ? <EditableCell field={field} value={data.custom[field.id] ?? ''} onChange={(value) => onFieldChange(data.key, field.id, value)} /> : null,
    }))

    return [
      { field: 'name', headerName: 'Project', pinned: 'left', lockPinned: true, width: 290, minWidth: 250, cellRenderer: ProjectIdentityCell, cellRendererParams: { onSelect } },
      { field: 'peatsNumber', headerName: 'PEATS #', width: 132 },
      { field: 'account', headerName: 'Account', width: 160 },
      { field: 'manager', headerName: 'Manager', width: 178, cellRenderer: ManagerCell },
      { field: 'quotedPrice', headerName: 'Quoted price', width: 138, cellClass: 'ag-right-aligned-cell', headerClass: 'ag-right-aligned-header', filter: 'agNumberColumnFilter', valueFormatter: ({ value }) => formatMoney(Number(value)) },
      { field: 'budgetCode', headerName: 'Budget code', width: 132 },
      { field: 'cp4Name', headerName: 'CP4 name', width: 170 },
      { field: 'developmentStatus', headerName: 'Development status', width: 166 },
      { headerName: 'Milestones', marryChildren: true, children: milestoneColumns },
      { field: 'reporter', headerName: 'Reporter', width: 150 },
      { field: 'targetDate', headerName: 'Target date', width: 128, valueFormatter: ({ value }) => value ? formatDate(String(value)) : '—' },
      { field: 'portalStatus', headerName: 'Portal status', width: 140, valueFormatter: ({ value }) => value || '—' },
      { colId: 'linkedIssues', headerName: 'Linked issues', width: 126, valueGetter: ({ data }) => data?.linkedIssues.length ?? 0, valueFormatter: ({ value }) => `${value} linked` },
      { field: 'sourceKey', headerName: 'Source', width: 100 },
      ...customColumns,
    ]
  }, [fields, onFieldChange, onSelect])

  const defaultColDef = useMemo<ColDef<Project>>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 110,
  }), [])

  return (
    <div className="project-grid" aria-label="APA project register">
      <AgGridReact<Project>
        theme={gridTheme}
        rowData={projects}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={({ data }) => data.key}
        rowHeight={54}
        headerHeight={40}
        groupHeaderHeight={34}
        pagination
        paginationPageSize={25}
        paginationPageSizeSelector={[25, 50, 100]}
        animateRows={false}
        ensureDomOrder
        tooltipShowDelay={250}
      />
    </div>
  )
}
