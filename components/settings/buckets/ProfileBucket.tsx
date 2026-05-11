// components/settings/buckets/ProfileBucket.tsx
interface ProfileBucketProps {
  user: {
    name: string
    email: string
    role: string
    plan?: string
    photo?: string
  }
  labels?: {
    profile_name_label?: string
    profile_email_label?: string
    profile_role_label?: string
    profile_plan_label?: string
    profile_avatar_alt?: string
  }
}

export default function ProfileBucket({ user, labels = {} }: ProfileBucketProps) {
  const {
    profile_name_label = 'Name',
    profile_email_label = 'Email',
    profile_role_label = 'Role',
    profile_plan_label = 'Plan',
    profile_avatar_alt = 'Your avatar',
  } = labels

  return (
    <div className="profile-sheet">
      <div className="profile-avatar">
        {user.photo ? (
          <img src={user.photo.startsWith('http') ? user.photo : `/${user.photo}`} alt={profile_avatar_alt} />
        ) : (
          <span className="profile-initials">
            {user.name.split(' ').slice(0,2).map(n => n[0]).join('')}
          </span>
        )}
      </div>
      <div className="profile-fields">
        <div className="pf-row"><span className="pf-label">{profile_name_label}</span><span className="pf-value">{user.name}</span></div>
        <div className="pf-row"><span className="pf-label">{profile_email_label}</span><span className="pf-value">{user.email}</span></div>
        <div className="pf-row"><span className="pf-label">{profile_role_label}</span><span className="pf-value accent">{user.role}</span></div>
        <div className="pf-row"><span className="pf-label">{profile_plan_label}</span><span className="pf-value accent">{user.plan || 'Solo'}</span></div>
      </div>

      <style jsx>{`
        .profile-sheet {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
          background: #F9F9F9;
          border: 1px solid #ebebeb;
          border-radius: 14px;
          padding: 2rem;
        }
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #e8e8e8;
        }
        .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .profile-initials {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: #0a6ed1;
        }
        .profile-fields {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .pf-row {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid #e2e0e0;
        }
        .pf-row:last-child { border-bottom: none; }
        .pf-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #888;
          font-weight: 600;
          min-width: 60px;
        }
        .pf-value { font-size: 0.95rem; color: #111; font-weight: 500; }
        .pf-value.accent { color: #0a6ed1; font-weight: 700; }

        @media (max-width: 768px) {
          .profile-sheet { flex-direction: column; align-items: center; text-align: center; }
          .pf-row { flex-direction: column; gap: 0.2rem; }
        }
      `}</style>
    </div>
  )
}