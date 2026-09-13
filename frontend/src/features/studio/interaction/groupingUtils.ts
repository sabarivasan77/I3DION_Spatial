import { StudioWidgetNode } from '../types/studio';

const generateGroupId = () => `group_${Math.random().toString(36).substring(2, 8)}`;

export const groupSelectedNodes = (
  nodes: StudioWidgetNode[],
  selectedIds: string[]
): { updatedNodes: StudioWidgetNode[]; newGroupId: string | null } => {
  if (selectedIds.length < 2) return { updatedNodes: nodes, newGroupId: null };

  const targetNodes: StudioWidgetNode[] = [];
  const remainingNodes: StudioWidgetNode[] = [];

  nodes.forEach((node) => {
    if (selectedIds.includes(node.id)) {
      targetNodes.push(node);
    } else {
      remainingNodes.push(node);
    }
  });

  if (targetNodes.length < 2) return { updatedNodes: nodes, newGroupId: null };

  const groupId = generateGroupId();
  const groupNode: StudioWidgetNode = {
    id: groupId,
    type: 'container',
    name: `Group_${groupId.substring(6)}`,
    properties: {
      flexDirection: 'column',
      padding: 8,
      borderColor: '#94a3b8',
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: 'transparent',
    },
    children: targetNodes.map((n) => ({ ...n, parentId: groupId })),
    isGroup: true,
  };

  return {
    updatedNodes: [...remainingNodes, groupNode],
    newGroupId: groupId,
  };
};

export const ungroupSelectedGroup = (
  nodes: StudioWidgetNode[],
  groupId: string
): StudioWidgetNode[] => {
  const groupNode = nodes.find((n) => n.id === groupId);
  if (!groupNode || !groupNode.children) return nodes;

  const childrenWithoutParentId = groupNode.children.map((c) => ({
    ...c,
    parentId: groupNode.parentId || null,
  }));

  const filtered = nodes.filter((n) => n.id !== groupId);
  return [...filtered, ...childrenWithoutParentId];
};
