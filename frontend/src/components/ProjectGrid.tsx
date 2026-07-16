import { useCallback, useMemo } from 'react'
import {
  CellStyleModule,
  ClientSideRowModelModule,
  DateEditorModule,
  ModuleRegistry,
  NumberEditorModule,
  NumberFilterModule,
  PaginationModule,
  TextEditorModule,
  TextFilterModule,
  TooltipModule,
  ValidationModule,
  themeBalham,
} from 'ag-grid-community'
import type { CellEditRequestEvent, ColDef, ColGroupDef, ICellRendererParams } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { portalStatusOptions } from '../config/workspaceFieldPolicy'
import { milestoneNames } from '../types'
import type { FieldDefinition, ManualMilestoneName, MilestoneName, MilestoneStatus, MilestoneUpdate, Project, ProjectUpdate } from '../types'
import { formatDate, formatMoney } from '../utils'
import { Icon } from './Icon'
import { SelectMenu } from './SelectMenu'
import type { SelectMenuOption } from './SelectMenu'

ModuleRegistry.registerModules([
  CellStyleModule,
  ClientSideRowModelModule,
  DateEditorModule,
  NumberEditorModule,
  NumberFilterModule,
  PaginationModule,
  TextEditorModule,
  TextFilterModule,
  TooltipModule,
])

if (import.meta.env.DEV) ModuleRegistry.registerModules([ValidationModule])

const gridTheme = themeBalham.withParams({
  accentColor: '#4f46e5',
  backgroundColor: '#ffffff',
  borderColor: '#dfe3e8',
  borderRadius: 0,
  foregroundColor: '#202b3a',
  headerBackgroundColor: '#f7f8fa',
  headerTextColor: '#536171',
  spacing: 5,
})

const milestoneStatuses: MilestoneStatus[] = ['not_started', 'in_progress', 'done', 'blocked']
const milestoneLabels: Record<MilestoneStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
  blocked: 'Blocked',
}
const milestoneStatusOptions: SelectMenuOption<MilestoneStatus>[] = milestoneStatuses.map((status) => ({
  value: status,
  label: milestoneLabels[status],
  tone: status,
}))

const milestoneColumnId = (name: MilestoneName) => `milestone_${name.toLowerCase().replace(/\s+/g, '_')}`

interface ProjectGridProps {
  projects: Project[]
  fields: FieldDefinition[]
  onSelect: (project: Project) => void
  onProjectChange: (key: string, update: ProjectUpdate) => void
  onMilestoneChange: (key: string, milestone: ManualMilestoneName, update: MilestoneUpdate) => void
  onFieldChange: (key: string, field: string, value: string | number | boolean) => void
}

function ProjectIdentityCell({ data, onSelect }: ICellRendererParams<Project> & { onSelect: (project: Project) => void }) {
  if (!data) return null
  return (
    <button type="button" className="grid-project-link" onClick={() => onSelect(data)} aria-label={`Open ${data.name}`}>
      <span><strong>{data.name}</strong><small><code>{data.key}</code> · {data.peatsNumber}</small></span>
      <Icon name="chevron" size={14} />
    </button>
  )
}

function ManagerCell({ data }: ICellRendererParams<Project>) {
  if (!data) return null
  return <span className="grid-manager"><span className="avatar">{data.managerInitials}</span><strong>{data.manager}</strong></span>
}

function MilestoneCell({ data, milestoneName, onMilestoneChange }: ICellRendererParams<Project> & { milestoneName: MilestoneName; onMilestoneChange: ProjectGridProps['onMilestoneChange'] }) {
  if (!data) return null
  const milestone = data.milestones.find((item) => item.name === milestoneName)
  if (!milestone) return null
  if (!milestone.automatic && milestoneName !== 'Assessment') {
    return (
      <SelectMenu
        ariaLabel={`${milestoneName} status`}
        value={milestone.status}
        options={milestoneStatusOptions}
        variant="cell"
        onValueChange={(status) => onMilestoneChange(data.key, milestoneName, {
          status,
          startedAt: milestone.startedAt,
          completedAt: milestone.completedAt,
        })}
      />
    )
  }
  return (
    <span className={`grid-milestone ${milestone.status}`} title={`${milestoneName} is derived from JIRA`}>
      <span className={`select-menu-status tone-${milestone.status}`}>{milestone.status === 'done' ? <Icon name="check" size={9} /> : null}</span>
      <span><strong>{milestoneLabels[milestone.status]}</strong>{milestone.durationDays ? <small>{milestone.durationDays} days</small> : <small>JIRA</small>}</span>
      <Icon name="lock" size={12} />
    </span>
  )
}

function customFieldValue(field: FieldDefinition, project: Project) {
  const value = project.custom[field.id]
  if (field.type === 'boolean') return value === true ? 'Yes' : 'No'
  return value ?? ''
}

function customCellEditor(field: FieldDefinition): Pick<ColDef<Project>, 'cellEditor'> {
  if (field.type === 'number') return { cellEditor: 'agNumberCellEditor' }
  if (field.type === 'date') return { cellEditor: 'agDateStringCellEditor' }
  return { cellEditor: 'agTextCellEditor' }
}

function castCustomValue(field: FieldDefinition, value: unknown): string | number | boolean {
  if (field.type === 'boolean') return String(value).toLowerCase() === 'yes' || String(value).toLowerCase() === 'true'
  if (field.type === 'number') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return String(value ?? '')
}

function CustomDropdownCell({ data, field, onFieldChange }: ICellRendererParams<Project> & { field: FieldDefinition; onFieldChange: ProjectGridProps['onFieldChange'] }) {
  if (!data) return null
  const options = field.type === 'boolean' ? ['Yes', 'No'] : field.options ?? []
  return (
    <SelectMenu
      ariaLabel={`${field.label} for ${data.name}`}
      value={String(customFieldValue(field, data))}
      options={options.map((option) => ({ value: option, label: option }))}
      variant="cell"
      onValueChange={(value) => onFieldChange(data.key, field.id, castCustomValue(field, value))}
    />
  )
}

function PortalStatusCell({ data, onProjectChange }: ICellRendererParams<Project> & { onProjectChange: ProjectGridProps['onProjectChange'] }) {
  if (!data) return null
  const options = [{ value: '', label: 'Not set' }, ...portalStatusOptions.map((option) => ({ value: option, label: option }))]
  return (
    <SelectMenu
      ariaLabel={`Portal status for ${data.name}`}
      value={data.portalStatus}
      options={options}
      variant="cell"
      onValueChange={(portalStatus) => onProjectChange(data.key, { portalStatus })}
    />
  )
}

export function ProjectGrid({ projects, fields, onSelect, onProjectChange, onMilestoneChange, onFieldChange }: ProjectGridProps) {
  const handleEditRequest = useCallback((event: CellEditRequestEvent<Project>) => {
    if (!event.data || event.newValue === event.oldValue) return
    const colId = event.column.getColId()

    if (colId === 'targetDate') {
      onProjectChange(event.data.key, { targetDate: String(event.newValue ?? '') })
      return
    }
    if (colId === 'portalStatus') {
      onProjectChange(event.data.key, { portalStatus: String(event.newValue ?? '') })
      return
    }

    const field = fields.find((item) => `custom_${item.id}` === colId)
    if (field) onFieldChange(event.data.key, field.id, castCustomValue(field, event.newValue))
  }, [fields, onFieldChange, onProjectChange])

  const columnDefs = useMemo<(ColDef<Project> | ColGroupDef<Project>)[]>(() => {
    const milestoneColumns: ColDef<Project>[] = milestoneNames.map((milestoneName) => {
      const automatic = milestoneName === 'Assessment'
      return {
        colId: milestoneColumnId(milestoneName),
        headerName: milestoneName,
        headerTooltip: automatic ? 'JIRA source · read only' : 'Workspace field · click to edit',
        width: milestoneName === 'Technical ARP' ? 152 : 132,
        minWidth: 124,
        sortable: false,
        filter: false,
        suppressHeaderMenuButton: true,
        editable: false,
        headerClass: automatic ? 'source-header' : 'workspace-header',
        cellClass: automatic ? 'source-cell' : 'workspace-cell dropdown-cell',
        cellRenderer: MilestoneCell,
        cellRendererParams: { milestoneName, onMilestoneChange },
        valueGetter: ({ data }) => milestoneLabels[data?.milestones.find((item) => item.name === milestoneName)?.status ?? 'not_started'],
      }
    })

    const customColumns: ColDef<Project>[] = fields.filter((field) => field.active && field.visible).map((field) => {
      const isDropdown = field.type === 'enum' || field.type === 'boolean'
      return {
        colId: `custom_${field.id}`,
        headerName: field.label,
        headerTooltip: `Workspace ${field.type} field · click to edit`,
        width: 170,
        filter: true,
        editable: !isDropdown,
        headerClass: 'workspace-header',
        cellClass: isDropdown ? 'workspace-cell dropdown-cell' : 'workspace-cell',
        valueGetter: ({ data }) => data ? customFieldValue(field, data) : '',
        valueFormatter: field.type === 'date' ? ({ value }) => value ? formatDate(String(value)) : '—' : undefined,
        cellRenderer: isDropdown ? CustomDropdownCell : undefined,
        cellRendererParams: isDropdown ? { field, onFieldChange } : undefined,
        ...(isDropdown ? {} : customCellEditor(field)),
      }
    })

    const source = (definition: ColDef<Project>): ColDef<Project> => ({
      editable: false,
      headerClass: 'source-header',
      cellClass: 'source-cell',
      headerTooltip: 'JIRA source · read only',
      ...definition,
    })

    return [
      source({ field: 'name', headerName: 'Project', pinned: 'left', lockPinned: true, width: 310, minWidth: 270, cellClass: 'source-cell project-cell', cellRenderer: ProjectIdentityCell, cellRendererParams: { onSelect } }),
      source({ field: 'manager', headerName: 'Owner', width: 180, cellRenderer: ManagerCell }),
      source({ field: 'quotedPrice', headerName: 'Quoted price', width: 145, cellClass: 'source-cell ag-right-aligned-cell', headerClass: 'source-header ag-right-aligned-header', filter: 'agNumberColumnFilter', valueFormatter: ({ value }) => formatMoney(Number(value)) }),
      { headerName: 'Development lifecycle · 8 milestones', marryChildren: true, headerClass: 'milestone-group-header', children: milestoneColumns },
      { headerName: 'Workspace · editable', marryChildren: true, headerClass: 'workspace-group-header', children: [
        { field: 'targetDate', headerName: 'Target date', width: 142, editable: true, cellEditor: 'agDateStringCellEditor', headerClass: 'workspace-header', cellClass: 'workspace-cell', headerTooltip: 'Workspace date · click to edit', valueFormatter: ({ value }) => value ? formatDate(String(value)) : '—' },
        { field: 'portalStatus', headerName: 'Portal status', width: 158, editable: portalStatusOptions.length === 0, cellEditor: portalStatusOptions.length === 0 ? 'agTextCellEditor' : undefined, cellRenderer: portalStatusOptions.length ? PortalStatusCell : undefined, cellRendererParams: portalStatusOptions.length ? { onProjectChange } : undefined, headerClass: 'workspace-header', cellClass: portalStatusOptions.length ? 'workspace-cell dropdown-cell' : 'workspace-cell', headerTooltip: portalStatusOptions.length ? 'Workspace dropdown · click to edit' : 'Workspace text · click to edit', valueFormatter: ({ value }) => value || '—' },
        ...customColumns,
      ] },
      { headerName: 'JIRA details · read only', marryChildren: true, headerClass: 'source-group-header', children: [
        source({ field: 'peatsNumber', headerName: 'PEATS #', width: 138 }),
        source({ field: 'account', headerName: 'Account', width: 168 }),
        source({ field: 'developmentStatus', headerName: 'JIRA dev status', width: 166 }),
        source({ field: 'budgetCode', headerName: 'Budget code', width: 138 }),
        source({ field: 'cp4Name', headerName: 'CP4 name', width: 180 }),
        source({ field: 'reporter', headerName: 'Reporter', width: 158 }),
        source({ colId: 'linkedIssues', headerName: 'Linked issues', width: 132, valueGetter: ({ data }) => data?.linkedIssues.length ?? 0, valueFormatter: ({ value }) => `${value} linked` }),
        source({ field: 'sourceKey', headerName: 'Source', width: 112 }),
      ] },
    ]
  }, [fields, onFieldChange, onMilestoneChange, onProjectChange, onSelect])

  const defaultColDef = useMemo<ColDef<Project>>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 116,
  }), [])

  return (
    <div className="project-grid" aria-label="APA project register">
      <AgGridReact<Project>
        theme={gridTheme}
        rowData={projects}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={({ data }) => data.key}
        onCellEditRequest={handleEditRequest}
        readOnlyEdit
        singleClickEdit
        stopEditingWhenCellsLoseFocus
        rowHeight={58}
        headerHeight={42}
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
