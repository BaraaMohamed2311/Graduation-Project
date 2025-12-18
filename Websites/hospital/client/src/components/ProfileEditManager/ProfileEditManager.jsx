// ===================================================
//        Profile Edit Manager (Reusable)
// ===================================================
import { useState } from "react";
import UpdateUserForm from "@/components/UpdateUserForm/UpdateUserForm";


const ProfileEditManager = ({
  role,
  userData,
  userDisplayed,
  update_handler,
  references,
  url = "",
  selfEditableFields, 
  approvalRequiredFields
}) => {
  const [isSelfEditing, setIsSelfEditing] = useState(false);
  const [isApprovalEditing, setIsApprovalEditing] = useState(false);

  const selfFields = selfEditableFields[role];
  const approvalFields = approvalRequiredFields[role];

  return (
    <>
      {/* Buttons */}
      <div className="buttons-wrapper">
        {selfFields?.inputs_info?.length > 0 && (
          <button className="grey-button" onClick={() => setIsSelfEditing(true)}>
            Edit Data
          </button>
        )}

        {approvalFields?.inputs_info?.length > 0 && (
          <button
            className="grey-button"
            onClick={() => setIsApprovalEditing(true)}
          >
            Request Edit Data
          </button>
        )}
      </div>

      {/* Self editable form */}
      {isSelfEditing && (
        <UpdateUserForm
          url={url}
          isEditing={isSelfEditing}
          setIsEditing={setIsSelfEditing}
          user_displayed={userDisplayed}
          userData={userData}
          references={references}
          update_handler={update_handler}
          fieldDefinitions={selfFields}
          isUpdatingSelf={true}
        />
      )}

      {/* Approval required form */}
      {isApprovalEditing && (
        <UpdateUserForm
          url={url}
          isEditing={isApprovalEditing}
          setIsEditing={setIsApprovalEditing}
          user_displayed={userDisplayed}
          userData={userData}
          references={references}
          update_handler={update_handler}
          fieldDefinitions={approvalFields}
          isUpdatingSelf={true}
        />
      )}
    </>
  );
};

export default ProfileEditManager;