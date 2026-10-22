import { canEditRules } from '../../lib/permissions'
import { Toggle } from '../../components/ui/Toggle'
import { useChat } from '../../state/chat'
import type { Channel, MemberRole } from '../../types'

const slowModes = [
  { value: 0, label: 'Off' },
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
]

export function PermissionsPanel({ channel, myRole }: { channel: Channel; myRole: MemberRole }) {
  const { updateChannel } = useChat()
  const editable = canEditRules(myRole)
  const { permissions } = channel

  const change = (patch: Partial<Channel['permissions']>) => updateChannel(channel.id, { permissions: { ...permissions, ...patch } })

  return (
    <section className="panel" aria-labelledby="perm-title">
      <div className="panel__head">
        <h2 className="panel__title" id="perm-title">
          What members can do
        </h2>
        <span className="faint">Applied immediately</span>
      </div>
      <div className="panel__body">
        <div className="setting-row">
          <div className="setting-row__text">
            <span className="setting-row__title">Send messages</span>
            <span className="setting-row__desc">When off, only the owner and admins can post.</span>
          </div>
          <Toggle label="Members can send messages" checked={permissions.membersCanSend} disabled={!editable} onChange={(value) => change({ membersCanSend: value })} />
        </div>
        <div className="setting-row">
          <div className="setting-row__text">
            <span className="setting-row__title">Invite people</span>
            <span className="setting-row__desc">Let members add friends to this channel.</span>
          </div>
          <Toggle label="Members can invite people" checked={permissions.membersCanInvite} disabled={!editable} onChange={(value) => change({ membersCanInvite: value })} />
        </div>
        <div className="setting-row">
          <div className="setting-row__text">
            <span className="setting-row__title">Share links</span>
            <span className="setting-row__desc">Allow members to post links.</span>
          </div>
          <Toggle label="Members can share links" checked={permissions.membersCanShareLinks} disabled={!editable} onChange={(value) => change({ membersCanShareLinks: value })} />
        </div>
        <div className="setting-row">
          <div className="setting-row__text">
            <label className="setting-row__title" htmlFor="slow-mode">
              Slow mode
            </label>
            <span className="setting-row__desc">Minimum wait between messages from members.</span>
          </div>
          <select
            id="slow-mode"
            className="select select--auto"
            disabled={!editable}
            value={permissions.slowModeSeconds}
            onChange={(event) => change({ slowModeSeconds: Number(event.target.value) })}
          >
            {slowModes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  )
}
