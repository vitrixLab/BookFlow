// components/settings/buckets/admin/RolesBucket.tsx
import { FILE } from 'dns'
import { useState } from 'react'

interface RolePermissions {
  manageServices: boolean
  manageUsers: boolean
  manageAppointments: boolean
  viewReports: boolean
  manageSettings: boolean
}

const defaultAdminPerms: RolePermissions = {
  manageServices: true, manageUsers: true, manageAppointments: true, viewReports: true, manageSettings: true,
}
const defaultEmployeePerms: RolePermissions = {
  manageServices: false, manageUsers: false, manageAppointments: true, viewReports: false, manageSettings: false,
}
const defaultClientPerms: RolePermissions = {
  manageServices: false, manageUsers: false, manageAppointments: false, viewReports: false, manageSettings: false,
}

export default function RolesBucket() {
  const [adminPerms, setAdminPerms] = useState(defaultAdminPerms)
  const [employeePerms, setEmployeePerms] = useState(defaultEmployeePerms)
  const [clientPerms, setClientPerms] = useState(defaultClientPerms)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const togglePerm = (role: string, key: keyof RolePermissions) => {
    if (role === 'Admin') setAdminPerms({ ...adminPerms, [key]: !adminPerms[key] })
    else if (role === 'Employee') setEmployeePerms({ ...employeePerms, [key]: !employeePerms[key] })
    else setClientPerms({ ...clientPerms, [key]: !clientPerms[key] })
  }

  // inside the RolesBucket component
  const formatLabel = (key: string) =>
    key
      .replace(/([A-Z])/g, ' $1')  // insert space before each capital
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await new Promise(resolve => setTimeout(resolve, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const renderRoleCard = (role: string, perms: RolePermissions, setter: any, lockAll: boolean) => (
    <div className="card" key={role}>
      <div className="card-head"  
          style={{ display: 'flex' }}
        >
        <i className={`fas fa-${role === 'Admin' ? 'users-cog' : role === 'Employee' ? 'user-check' : 'user'}`} 
          style={{ 
            marginTop: '5px', 
            paddingRight: '6px',  
            fontSize: '1.1rem',   
            fontWeight: '550',           
          }}
        />
        <h2>{role} Permissions</h2>
      </div>
        <p>&nbsp;</p>
      <div className="perm-list"
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <hr 
            style={{ 
              opacity: 0.3,
              marginBottom: '1rem'
            }}
          /> 
            {Object.entries(perms).map(([key, value]) => (
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.5rem' }}
              >
                <label key={key} className="perm-row">
                  <span
                    style={{ 
                      marginTop: '5px',  
                      marginLeft: '25px'           
                    }} 
                  >{formatLabel(key)}</span>
                  <input 
                    type="checkbox" 
                    checked={value} 
                    onChange={() => togglePerm(role, key as keyof RolePermissions)} 
                    disabled={lockAll} 
                    
                    style={{ 
                      marginTop: '-1rem'         
                    }} 
                  />
                </label>
              </div> 
            ))} 
      </div>
    </div>
  )

  return (
    <div className="roles-bucket">
      <h2 className="section-title">Roles & Access</h2>
      <p className="section-desc">Define what each role can do within BookFlow. Admin permissions are locked for safety.</p>

      <form onSubmit={handleSave}>
        <div className="roles-grid">
          {renderRoleCard('Admin', adminPerms, setAdminPerms, true)}
          {renderRoleCard('Employee', employeePerms, setEmployeePerms, false)}
          {renderRoleCard('Client', clientPerms, setClientPerms, false)}
        </div>

        <div className="form-actions">
          {saved && <span className="save-success"><i className="fas fa-check-circle" /> Saved</span>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : <><i className="fas fa-save" /> Save Permissions</>}
          </button>
        </div>
      </form>

      <style jsx>{`
        .roles-bucket { display: flex; flex-direction: column; gap: 1.25rem; }
        .section-title { font-family: 'Fraunces', Georgia, serif; font-size: 1.6rem; font-weight: 800; color: #111; margin: 0; }
        .section-desc { font-size: 0.88rem; color: #888; margin: -0.5rem 0 0; }
        .roles-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; }
        .card { background: #fff; border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; }
        .card-head { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
        .card-head i { font-size: 1.1rem; color: var(--sap-primary, #0a6ed1); }
        .card-head h2 { font-size: 0.92rem; font-weight: 700; color: #111; margin: 0; }
        .perm-list { padding: 0 1.4rem 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .perm-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.84rem; color: #333; padding: 0.4rem 0; border-bottom: 1px solid #f5f5f5; }
        .perm-row:last-child { border-bottom: none; }
        .perm-row input[type="checkbox"] { width: 18px; height: 18px; accent-color: #0a6ed1; }
        .form-actions { display: flex; justify-content: flex-end; align-items: center; gap: 1rem; margin-top: 0.5rem; }
        .btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 0.4rem; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
        .btn-primary:hover:not(:disabled) { background: #0854a0; }
        .save-success { font-size: 0.85rem; font-weight: 600; color: #22c55e; display: flex; align-items: center; gap: 0.3rem; animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}