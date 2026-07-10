import "./MembersSection.css";
import axios from "axios";
import { useState } from "react";

function MembersSection({
    members,
    role,
    fetchActiveInvite,
    currentUserId,
    fetchMembers,
    albumId,
    triggerToast,
    hasActiveInvite,
    activeInvite,
    timeRemaining,
})
{   
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [openMemberMenu,setOpenMemberMenu] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [copied,setCopied] = useState(false);
    const [inviteValidity, setInviteValidity] = useState("24h");
    const [memberSearch,setMemberSearch] = useState("");

    const generateInviteCode = async () => {

    try {

        const token =
            localStorage.getItem("token");

        await axios.post(
            `http://localhost:5000/api/albums/${albumId}/invite`,
            {
                validity: inviteValidity
            },
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        await fetchActiveInvite();

    }
    catch(error)
    {
        console.error(error);
    }
};

    const removeMember = async (userId) => {

    try {

        const token =
        localStorage.getItem("token");

        await axios.delete(
            `http://localhost:5000/api/albums/${albumId}/members/${userId}`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );
        triggerToast(
        "Member removed successfully",
        "success"
        );

        setShowRemoveModal(false);


        setOpenMemberMenu(null);

        fetchMembers();

    }
    catch(error)
    {
        console.error(error);

        alert(
        error.response?.data?.message ||
        "Failed to remove member"
        );
    }
};
const copyInviteCode = async () => {

    try {

        await navigator.clipboard.writeText(
            activeInvite.invite_code
        );

        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 2000);

    }
    catch(error)
    {
        console.error(error);
    }
};

    const filteredMembers = members.filter((member) =>
    {
        return member.full_name
            .toLowerCase()
            .includes(
                memberSearch.toLowerCase()
            );
    });
    const sortedMembers = [...filteredMembers].sort((a, b) => {

    if(a.id === currentUserId) return -1;
    if(b.id === currentUserId) return 1;

    return 0;
});
const updateMemberRole = async (userId, newRole) => {

    try {

        const token =
            localStorage.getItem("token");

        await axios.patch(
            `http://localhost:5000/api/albums/${albumId}/members/${userId}/role`,
            {
                role: newRole
            },
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        setOpenMemberMenu(null);

        fetchMembers();

    }
    catch(error)
    {
        console.error(error);

        alert(
            error.response?.data?.message
            ||
            "Failed to update role"
        );
    }
};
    const canShowMenu = (member) => {

    if(role === "viewer")
    {
        return false;
    }

    if(member.role === "owner")
    {
        return false;
    }

    if(role === "admin" && member.role !== "viewer")
    {
        return false;
    }

    return true;
    };

    return(
        <>
    <div className="albumpg-section-header">

    <div className="members-left-section">

        <h2>Members</h2>

        <input
            type="text"
            placeholder="Search members..."
            value={memberSearch}
            onChange={(e)=>
                setMemberSearch(e.target.value)
            }
            className="member-search-input"
        />

    </div>

    <div className="members-header-right">

        <span className="member-count-badge">
            {members.length} Members
        </span>

        {(role === "owner" || role === "admin") && (
            <button
                className="albumpg-primary-btn"
                onClick={async()=>{
                    await fetchActiveInvite();
                    setShowInviteModal(true);
                }}
            >
                Invite Members
            </button>
        )}

    </div>

</div>

        <div className="albumpg-members-card">

            {sortedMembers.map(member => (

                <div
                    key={member.id}
                    className="member-row"
                >

                    <div className="member-left">

                        {member.profile_pic ? (

                            <img
                                src={member.profile_pic}
                                alt={member.full_name}
                                className="member-avatar"
                            />

                        ) : (

                            <div className="member-avatar-fallback">

                                {member.full_name.charAt(0).toUpperCase()}

                            </div>

                        )}

                        <div>

                            <div className="member-name">
                                {member.full_name}
                                {member.id === currentUserId && (
                                <span className="member-you-badge">
                                    You
                                </span>
                            )}
                            </div>

                            <div className="member-email">
                                {member.email}
                            </div>

                        </div>

                    </div>

                    <div className="albumpg-member-actions">

  <div className="albumpg-member-role">
    {member.role === "owner"
      ? "👑 Owner"
      : member.role === "admin"
      ? "🛡️ Admin"
      : "👤 Viewer"}
  </div>
{
  showRemoveModal && (

    <div className="modal-overlay">

      <div className="join-modal">

        <h2>Remove Member</h2>

        <p>
          Remove {memberToRemove?.full_name} from this album?
        </p>

        <div className="modal-actions">

          <button
            className="btn-cancel"
            onClick={() =>
              setShowRemoveModal(false)
            }
          >
            Cancel
          </button>

          <button
            className="btn-danger"
            onClick={() =>
              removeMember(
                memberToRemove.id
              )
            }
          >
            Remove
          </button>

        </div>

      </div>

    </div>

  )
}
{showInviteModal && (

        <div className="modal-overlay">

            <div className="invite-modal">

                <h2>Invite Member</h2>
                {hasActiveInvite ? (

        <div className="active-invite-box">

        <div className="invite-title">
            Active Invite Code
        </div>

        <div className="invite-code">
            {activeInvite.invite_code}
        </div>

        <div className="invite-expiry">
        Expires In
    </div>

    <div className="invite-date">
        {timeRemaining}
    </div>

    <div className="invite-actual-date">
        Until {
            new Date(
                activeInvite.expires_at
            ).toLocaleString()
        }
    </div>

        <div className="modal-actions">
            <button
    className={
        copied
        ? "btn-success"
        : "btn-save"
    }
    onClick={copyInviteCode}
>
    {copied ? "✓ Copied" : "Copy Code"}
</button>

            <button
                className="btn-cancel"
                onClick={() =>
                    setShowInviteModal(false)
                }
            >
                Close
            </button>

        </div>

    </div>

) : (

    <>

        <p>
            Select how long the invite code
            should remain valid.
        </p>

        <div className="invite-options">

    <label>
        <input
            type="radio"
            value="1h"
            checked={inviteValidity==="1h"}
            onChange={(e)=>
                setInviteValidity(e.target.value)
            }
        />
        1 Hour
    </label>

    <label>
        <input
            type="radio"
            value="24h"
            checked={inviteValidity==="24h"}
            onChange={(e)=>
                setInviteValidity(e.target.value)
            }
        />
        24 Hours
    </label>

    <label>
        <input
            type="radio"
            value="7d"
            checked={inviteValidity==="7d"}
            onChange={(e)=>
                setInviteValidity(e.target.value)
            }
        />
        7 Days
    </label>

    <label>
        <input
            type="radio"
            value="30d"
            checked={inviteValidity==="30d"}
            onChange={(e)=>
                setInviteValidity(e.target.value)
            }
        />
        30 Days
    </label>

</div>

        <div className="modal-actions">

            <button
                className="btn-cancel"
                onClick={() =>
                    setShowInviteModal(false)
                }
            >
                Cancel
            </button>

            <button
                className="btn-save"
                onClick={generateInviteCode}
            >
                Generate Code
            </button>

        </div>

    </>

)}

        </div>

    </div>

)}
  {canShowMenu(member) && (

    <div className="albumpg-menu-wrapper">

      <button
        className="albumpg-menu-btn"
        onClick={() =>
          setOpenMemberMenu(
            openMemberMenu === member.id
              ? null
              : member.id
          )
        }
      >
        ⋮
      </button>

      {openMemberMenu === member.id && (

        <div className="albumpg-member-menu">

          {role === "owner" &&
           member.role === "viewer" && (

            <button onClick={() =>
        updateMemberRole(
            member.id,
            "admin"
        )
    }>
              Make Admin
            </button>
          )}

          {role === "owner" &&
           member.role === "admin" && (

            <button onClick={() =>
        updateMemberRole(
            member.id,
            "viewer"
        )
    }>
              Make Viewer
            </button>
          )}

          <button className="albumpg-danger-option" onClick={() => {
            setMemberToRemove(member);
            setShowRemoveModal(true);
            }}>
            Remove Member
          </button>

        </div>

      )}

    </div>

  )}

</div>

                </div>

            ))}

        </div>

        </>
    )
}
export default MembersSection