import { FormEvent, FunctionComponent, useCallback, useState } from "react";
import { Container, Leaf, LeafUri } from "@ldo/solid";
import { v4 } from "uuid";
import { useLdo } from "@ldo/solid-react";
import { PostShShapeType } from "./.ldo/post.shapeTypes";

export const MakePost: FunctionComponent<{ mainContainer?: Container }> = ({
  mainContainer,
}) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  

  const { createData, commitData } = useLdo();

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Don't create a post is main container isn't present
      if (!mainContainer) return;

      // Create the container for the post
      const postContainerResult = await mainContainer.createChildAndOverwrite(
        `${v4()}/`
      );
      // Check if there was an error
      if (postContainerResult.isError) {
        alert(postContainerResult.message);
        return;
      }
      const postContainer = postContainerResult.resource;

      // Upload Image
      let uploadedImage: Leaf | undefined;
      if (selectedFile) {
        const result = await postContainer.uploadChildAndOverwrite(
          selectedFile.name as LeafUri,
          selectedFile,
          selectedFile.type
        );
        if (result.isError) {
          alert(result.message);
          await postContainer.delete();
          return;
        }
        uploadedImage = result.resource;
      }

      // Create Post
      const indexResource = postContainer.child("index.ttl");
      // Create new data of type "Post" where the subject is the index
      // resource's uri, and write any changes to the indexResource.
      const post = createData(
        PostShShapeType,
        indexResource.uri,
        indexResource
      );
      // Set the article body
      post.articleBody = message;
      if (uploadedImage) {
        // Link the URI to the 
        post.image = { "@id": uploadedImage.uri };
      }
      // Say that the type is a "SocialMediaPosting"
      post.type = { "@id": "SocialMediaPosting" };
      // Add an upload date
      post.uploadDate = new Date().toISOString();
      // The commitData function handles sending the data to the Pod.
      const result = await commitData(post);
      if (result.isError) {
        alert(result.message);
      }
    },
    [mainContainer, selectedFile, createData, message, commitData]
  );

  return (
    <form onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Make a Post"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setSelectedFile(e.target.files?.[0])}
      />
      <input type="submit" value="Post" />
    </form>
  );
};