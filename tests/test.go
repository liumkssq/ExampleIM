package main

type TreeNode struct {
	Val   int
	Left  *TreeNode
	Right *TreeNode
}

/**
 * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
 *
 *
 * @param root TreeNode类
 * @return int整型
 */
//{1,2,3,4,#,#,5}
//   1
// 2  3
//4     5
//2
// 尽可能少的步骤删除节点变成满二叉树
// 小红拿到了一棵二叉树。她希望删除尽可能少的节点，使得该二叉树变成一棵满二叉树。
// 你能编写一个函数返回需要删除的节点最小数量吗？
// 一个二叉树，如果每一个层的节点数都达到最大值，则这个二叉树就是满二叉树。
// 示例：{1,2,3,4,#,#,#,5}
// 输出：2

func numOfNode(root *TreeNode) int {
	// 如果根节点为空，返回0
	if root == nil {
		return 0
	}

	// 计算树的高度
	height := getHeight(root)

	// 计算满二叉树的节点数
	fullTreeNodes := (1 << height) - 1

	// 计算当前树的节点数
	currentNodes := countNodes(root)

	// 需要删除的节点数 = 当前节点数 - 满二叉树节点数
	return currentNodes - fullTreeNodes
}

// 计算树的高度
func getHeight(root *TreeNode) int {
	if root == nil {
		return 0
	}

	// 计算左右子树的高度
	leftHeight := getHeight(root.Left)
	rightHeight := getHeight(root.Right)

	// 返回较小的高度 + 1
	if leftHeight < rightHeight {
		return leftHeight + 1
	}
	return rightHeight + 1
}

// 计算树的节点总数
func countNodes(root *TreeNode) int {
	if root == nil {
		return 0
	}

	// 递归计算左右子树的节点数，加上根节点
	return 1 + countNodes(root.Left) + countNodes(root.Right)
}
