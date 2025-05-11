using Microsoft.EntityFrameworkCore.Metadata.Conventions;

namespace MptRoomAPI.Models.Enums
{
    public enum SupersedeRequestTypeEnum
    {
        moved = 1,
        canceled = 2,
        added = 3
    }
}
