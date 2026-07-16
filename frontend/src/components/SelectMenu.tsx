import * as Select from '@radix-ui/react-select'
import { Icon } from './Icon'

export type SelectTone = 'not_started' | 'in_progress' | 'done' | 'blocked'

export interface SelectMenuOption<T extends string = string> {
  value: T
  label: string
  description?: string
  tone?: SelectTone
}

interface SelectMenuProps<T extends string> {
  ariaLabel: string
  value: T
  options: readonly SelectMenuOption<T>[]
  onValueChange: (value: T) => void
  placeholder?: string
  variant?: 'cell' | 'filter' | 'field'
  className?: string
  prefix?: string
}

/**
 * Shared select surface for the register, filters, and forms.
 * Radix owns keyboard, focus, typeahead, and portal positioning while this
 * component owns the product-specific density and status language.
 */
export function SelectMenu<T extends string>({
  ariaLabel,
  value,
  options,
  onValueChange,
  placeholder = 'Select an option',
  variant = 'field',
  className = '',
  prefix,
}: SelectMenuProps<T>) {
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined

  return (
    <Select.Root
      value={selectedIndex >= 0 ? String(selectedIndex) : undefined}
      onValueChange={(index) => {
        const option = options[Number(index)]
        if (option) onValueChange(option.value)
      }}
    >
      <Select.Trigger
        className={`select-menu-trigger select-menu-trigger--${variant} ${selectedOption?.tone ? `tone-${selectedOption.tone}` : ''} ${className}`.trim()}
        aria-label={ariaLabel}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <span className="select-menu-trigger-content">
          {prefix ? <span className="select-menu-prefix">{prefix}</span> : null}
          {selectedOption?.tone ? <StatusMark tone={selectedOption.tone} /> : null}
          <Select.Value className="select-menu-value" placeholder={selectedOption?.label ?? (value || placeholder)} />
        </span>
        <Select.Icon className="select-menu-chevron"><Icon name="down" size={12} /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="select-menu-content"
          position="popper"
          sideOffset={4}
          collisionPadding={8}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          <Select.ScrollUpButton className="select-menu-scroll"><Icon name="down" size={12} /></Select.ScrollUpButton>
          <Select.Viewport className="select-menu-viewport">
            {options.map((option, index) => (
              <Select.Item className="select-menu-item" value={String(index)} key={`${option.value}-${index}`}>
                {option.tone ? <StatusMark tone={option.tone} /> : <span className="select-menu-item-spacer" />}
                <span className="select-menu-copy">
                  <Select.ItemText>{option.label}</Select.ItemText>
                  {option.description ? <small>{option.description}</small> : null}
                </span>
                <Select.ItemIndicator className="select-menu-indicator"><Icon name="check" size={14} /></Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="select-menu-scroll"><Icon name="down" size={12} /></Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

function StatusMark({ tone }: { tone: SelectTone }) {
  return <span className={`select-menu-status tone-${tone}`} aria-hidden="true">{tone === 'done' ? <Icon name="check" size={9} /> : null}</span>
}
