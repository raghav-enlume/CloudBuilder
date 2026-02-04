import { NodeProps } from 'reactflow';
import GroupNode from './GroupNode';
import AwsResourceNode from './AwsResourceNode';

const ResourceNode = (props: NodeProps) => {
  const { data } = props;
  const { isContainer } = data;

  // Delegate to appropriate component based on node type
  if (isContainer) {
    return <GroupNode {...props} />;
  }

  return <AwsResourceNode {...props} />;
};

ResourceNode.displayName = 'ResourceNode';

export default ResourceNode;
