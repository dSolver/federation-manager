
import './App.css';
import { ProjectList } from './ProjectUI/ProjectList';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ProjectPage } from './ProjectUI/ProjectPage';
import { PackagePage } from './PackageUI/PackagePage';
import { PackageEditorPage } from './PackageUI/PackageEditorPage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectPage />} />
          <Route path="projects/:projectId/packages/:packageId" element={<PackagePage />} />
          <Route path="projects/:projectId/packages/:packageId/edit" element={<PackageEditorPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
